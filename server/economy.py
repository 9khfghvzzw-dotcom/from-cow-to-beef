"""Server-only economy core. Never expose credit_verified_payment directly.

A payment adapter must verify a provider signature and retrieve the completed
capture from that provider before calling it. User IDs must come from a verified
session, never a request parameter. No live payment provider is configured yet.
"""
import sqlite3
from contextlib import contextmanager


class EconomyError(ValueError):
    pass


def connect(path):
    db = sqlite3.connect(path, timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db


def initialize(db):
    db.executescript('''
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0 CHECK(coins>=0));
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
      currency TEXT NOT NULL, gold INTEGER NOT NULL CHECK(gold>0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')));
    CREATE TABLE IF NOT EXISTS payments (
      provider TEXT NOT NULL, capture_id TEXT NOT NULL, order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
      PRIMARY KEY(provider,capture_id));
    CREATE TABLE IF NOT EXISTS purchases (
      user_id TEXT NOT NULL REFERENCES users(id), request_id TEXT NOT NULL,
      item_id TEXT NOT NULL, cost INTEGER NOT NULL CHECK(cost>0),
      PRIMARY KEY(user_id,request_id));
    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT NOT NULL REFERENCES users(id), item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity>0), PRIMARY KEY(user_id,item_id));
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL CHECK(amount<>0), kind TEXT NOT NULL,
      reference TEXT NOT NULL, UNIQUE(user_id,kind,reference));
    ''')


@contextmanager
def transaction(db):
    db.execute('BEGIN IMMEDIATE')
    try:
        yield
        db.commit()
    except Exception:
        db.rollback()
        raise


def positive_integer(value):
    if type(value) is not int or value <= 0:
        raise EconomyError('Expected a positive integer')
    return value


def create_order(db, *, user_id, order_id, provider, package_id, catalog):
    """catalog is server configuration, not JSON supplied by a customer."""
    package = catalog.get(package_id)
    if not package:
        raise EconomyError('Unknown package')
    amount = positive_integer(package['amount_minor'])
    gold = positive_integer(package['gold'])
    currency = package['currency']
    if not isinstance(currency, str) or len(currency) != 3 or not currency.isupper():
        raise EconomyError('Invalid currency')
    with transaction(db):
        if not db.execute('SELECT 1 FROM users WHERE id=?', (user_id,)).fetchone():
            raise EconomyError('Unknown user')
        db.execute('INSERT INTO orders(id,user_id,provider,amount_minor,currency,gold) VALUES(?,?,?,?,?,?)',
                   (order_id, user_id, provider, amount, currency, gold))
    return dict(db.execute('SELECT * FROM orders WHERE id=?', (order_id,)).fetchone())


def credit_verified_payment(db, *, provider, capture_id, order_id, amount_minor, currency, completed):
    """Accept only facts retrieved and verified by the trusted provider adapter."""
    positive_integer(amount_minor)
    if completed is not True or not capture_id:
        raise EconomyError('Payment is not completed')
    with transaction(db):
        order = db.execute('SELECT * FROM orders WHERE id=?', (order_id,)).fetchone()
        if not order or (order['provider'], order['amount_minor'], order['currency']) != (provider, amount_minor, currency):
            raise EconomyError('Payment does not match the server order')
        existing = db.execute('SELECT order_id FROM payments WHERE provider=? AND capture_id=?',
                              (provider, capture_id)).fetchone()
        if existing:
            if existing['order_id'] != order_id:
                raise EconomyError('Capture already belongs to another order')
            return 'already_processed'
        if order['status'] != 'pending':
            raise EconomyError('Order is already paid')
        db.execute('INSERT INTO payments VALUES(?,?,?)', (provider, capture_id, order_id))
        changed = db.execute('UPDATE users SET coins=coins+? WHERE id=?', (order['gold'], order['user_id']))
        if changed.rowcount != 1:
            raise EconomyError('User does not exist')
        db.execute('INSERT INTO ledger(user_id,amount,kind,reference) VALUES(?,?,?,?)',
                   (order['user_id'], order['gold'], 'CREDIT_PURCHASE', order_id))
        db.execute("UPDATE orders SET status='paid' WHERE id=?", (order_id,))
    return 'credited'


def buy_item(db, *, user_id, request_id, item_id, catalog):
    if not isinstance(request_id, str) or not 1 <= len(request_id) <= 128:
        raise EconomyError('A request ID is required')
    with transaction(db):
        existing = db.execute('SELECT item_id FROM purchases WHERE user_id=? AND request_id=?',
                              (user_id, request_id)).fetchone()
        if existing:
            if existing['item_id'] != item_id:
                raise EconomyError('Request ID reused for a different item')
            return 'already_processed'
        if item_id not in catalog:
            raise EconomyError('Unknown item')
        price = positive_integer(catalog[item_id]['gold'])
        changed = db.execute('UPDATE users SET coins=coins-? WHERE id=? AND coins>=?', (price, user_id, price))
        if changed.rowcount != 1:
            raise EconomyError('Unknown user or insufficient funds')
        db.execute('INSERT INTO purchases VALUES(?,?,?,?)', (user_id, request_id, item_id, price))
        db.execute('INSERT INTO inventory VALUES(?,?,1) ON CONFLICT(user_id,item_id) DO UPDATE SET quantity=quantity+1',
                   (user_id, item_id))
        db.execute('INSERT INTO ledger(user_id,amount,kind,reference) VALUES(?,?,?,?)',
                   (user_id, -price, 'ITEM_BUY', request_id))
    return 'purchased'
