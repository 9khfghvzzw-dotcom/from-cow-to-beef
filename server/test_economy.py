import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from economy import connect, initialize, create_order, credit_verified_payment, buy_item, EconomyError


class EconomyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'test.sqlite'
        self.db = connect(self.path)
        initialize(self.db)
        self.db.execute("INSERT INTO users VALUES('alice',0)")
        # Test fixtures only: not approved retail pricing.
        self.packages = {'test': {'gold': 100, 'amount_minor': 500, 'currency': 'ILS'}}
        create_order(self.db, user_id='alice', order_id='order-1', provider='test', package_id='test', catalog=self.packages)
        self.receipt = dict(provider='test', capture_id='capture-1', order_id='order-1', amount_minor=500, currency='ILS', completed=True)

    def tearDown(self):
        self.db.close()
        self.temp.cleanup()

    def test_credit_and_replay_close_transaction(self):
        self.assertEqual(credit_verified_payment(self.db, **self.receipt), 'credited')
        self.assertEqual(credit_verified_payment(self.db, **self.receipt), 'already_processed')
        self.assertFalse(self.db.in_transaction)
        self.assertEqual(self.db.execute('SELECT coins FROM users').fetchone()[0], 100)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM ledger').fetchone()[0], 1)

    def test_reject_mismatch_and_incomplete_payment(self):
        for change in ({'amount_minor': 1}, {'currency': 'USD'}, {'completed': False}, {'provider': 'wrong'}):
            with self.assertRaises(EconomyError):
                credit_verified_payment(self.db, **(self.receipt | change))
        self.assertEqual(self.db.execute('SELECT coins FROM users').fetchone()[0], 0)

    def test_concurrent_duplicate_payment(self):
        def fulfill(_):
            db = connect(self.path)
            try:
                return credit_verified_payment(db, **self.receipt)
            finally:
                db.close()
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(fulfill, range(8)))
        self.assertEqual(results.count('credited'), 1)
        self.assertEqual(self.db.execute('SELECT coins FROM users').fetchone()[0], 100)

    def test_purchase_retry_and_distinct_purchases(self):
        credit_verified_payment(self.db, **self.receipt)
        args = dict(user_id='alice', request_id='buy-1', item_id='seed', catalog={'seed': {'gold': 30}})
        self.assertEqual(buy_item(self.db, **args), 'purchased')
        self.assertEqual(buy_item(self.db, **args), 'already_processed')
        buy_item(self.db, **(args | {'request_id': 'buy-2'}))
        self.assertEqual(self.db.execute('SELECT coins FROM users').fetchone()[0], 40)
        self.assertEqual(self.db.execute('SELECT quantity FROM inventory').fetchone()[0], 2)
        with self.assertRaises(EconomyError):
            buy_item(self.db, **(args | {'item_id': 'different'}))

    def test_insufficient_funds_and_negative_prices(self):
        for price in (-10, 0, True, 50):
            with self.assertRaises(EconomyError):
                buy_item(self.db, user_id='alice', request_id='buy', item_id='seed', catalog={'seed': {'gold': price}})
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM inventory').fetchone()[0], 0)

    def test_concurrent_debits_cannot_overdraw(self):
        credit_verified_payment(self.db, **self.receipt)
        def buy(i):
            db = connect(self.path)
            try:
                return buy_item(db, user_id='alice', request_id=str(i), item_id='seed', catalog={'seed': {'gold': 60}})
            except EconomyError:
                return 'rejected'
            finally:
                db.close()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(buy, range(2)))
        self.assertEqual(results.count('purchased'), 1)
        self.assertEqual(self.db.execute('SELECT coins FROM users').fetchone()[0], 40)


if __name__ == '__main__':
    unittest.main()
