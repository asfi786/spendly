"""Headless-Chromium smoke test for the Spendly v2 production build.
Serves dist/, seeds localStorage, visits key routes, collects console errors."""
import json, subprocess, sys, time, urllib.request, os
sys.path.insert(0, '/tmp')
from cdp_shot import ws_connect, ws_send, ws_recv  # noqa

PORT = 8901
DIST = os.path.expanduser('~/workspace/spendly/dist')

SEED = {
    "onboarded": True,
    "user": {"name": "QA Tester", "email": "qa@example.com", "currency": "PKR", "theme": "dark"},
    "transactions": [
        {"id": "t1", "type": "expense", "amount": 850, "title": "Lunch", "category": "Food",
         "date": "2026-10-03", "paymentMethod": "Cash", "notes": "", "receipt": None,
         "recurring": False, "createdAt": "2026-10-03T10:00:00.000Z", "nature": "variable"},
        {"id": "t2", "type": "expense", "amount": 25000, "title": "House Rent", "category": "Bills",
         "date": "2026-10-01", "paymentMethod": "Bank", "notes": "", "receipt": None,
         "recurring": True, "createdAt": "2026-10-01T10:00:00.000Z", "nature": "fixed"},
        {"id": "t3", "type": "income", "amount": 120000, "title": "Salary", "category": "Salary",
         "date": "2026-10-01", "paymentMethod": "Bank", "notes": "", "receipt": None,
         "recurring": False, "createdAt": "2026-10-01T10:00:00.000Z"},
        {"id": "t4", "type": "expense", "amount": 3000, "title": "Groceries", "category": "Food",
         "date": "2026-09-15", "paymentMethod": "Card", "notes": "", "receipt": None,
         "recurring": False, "createdAt": "2026-09-15T10:00:00.000Z", "nature": "variable"},
    ],
    "budgets": [
        {"id": "b1", "category": "Food", "amount": 15000, "month": "2026-10", "period": "monthly"},
        {"id": "b2", "category": "Travel", "amount": 200000, "month": "2026-01", "period": "yearly", "year": "2026"},
    ],
    "goals": [
        {"id": "g1", "name": "Emergency fund", "targetAmount": 100000, "currentAmount": 25000,
         "targetDate": "2027-04-01",
         "contributions": [{"id": "c1", "amount": 25000, "date": "2026-09-01"}],
         "createdAt": "2026-09-01T10:00:00.000Z"},
    ],
    "bills": [
        {"id": "bl1", "title": "House Rent", "amount": 25000, "category": "Bills",
         "frequency": "monthly", "dayOfMonth": 5, "nextDue": "2026-10-05", "notes": "",
         "createdAt": "2026-09-01T10:00:00.000Z", "history": []},
        {"id": "bl2", "title": "Netflix", "amount": 1500, "category": "Entertainment",
         "frequency": "monthly", "dayOfMonth": 20, "nextDue": "2026-09-20", "notes": "",
         "createdAt": "2026-09-01T10:00:00.000Z", "history": []},
    ],
    "selectedMonth": "2026-10",
}

ROUTES = ['/', '/app', '/app/transactions', '/app/bills', '/app/advisor',
          '/app/analytics', '/app/budgets', '/app/goals', '/app/settings', '/privacy']

def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', DIST],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    chrome = subprocess.Popen(
        ['/opt/meta-chromium/chrome', '--headless=new', '--no-sandbox', '--disable-gpu',
         '--remote-debugging-port=9333', '--user-data-dir=/tmp/chrome-qa', 'about:blank'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    errors = []
    try:
        tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9333/json/list').read().decode())
        page = [t for t in tabs if t['type'] == 'page'][0]
        s = ws_connect(page['webSocketDebuggerUrl'])
        mid = [0]
        def send(method, params=None):
            mid[0] += 1
            ws_send(s, {'id': mid[0], 'method': method, 'params': params or {}})
            return mid[0]
        def recv_until(ids, timeout=15):
            out = {}
            end = time.time() + timeout
            while time.time() < end and not all(i in out for i in ids):
                try:
                    m = ws_recv(s, timeout=max(0.1, end - time.time()))
                except Exception:
                    break
                d = m if isinstance(m, dict) else json.loads(m)
                if 'id' in d and d['id'] in ids:
                    out[d['id']] = d
                elif d.get('method') in ('Runtime.consoleAPICalled', 'Runtime.exceptionThrown'):
                    errors.append(d)
            return out
        send('Runtime.enable'); send('Page.enable'); recv_until([1, 2], 5)
        errors.clear()

        def js(expr):
            i = send('Runtime.evaluate', {'expression': expr, 'awaitPromise': True, 'returnByValue': True})
            r = recv_until([i], 10).get(i, {})
            return (r.get('result') or {}).get('result', {}).get('value')

        js(f"localStorage.setItem('spendly:v1', {json.dumps(json.dumps(SEED))}); 'seeded'")
        for route in ROUTES:
            n_before = len(errors)
            js(f"history.pushState({{}}, '', '{route}'); window.dispatchEvent(new PopStateEvent('popstate')); 'nav'")
            time.sleep(2.2)
            title = js('document.title')
            new_errs = errors[n_before:]
            bad = [e for e in new_errs
                   if (e.get('method') == 'Runtime.consoleAPICalled'
                       and e.get('params', {}).get('type') in ('error',))
                   or e.get('method') == 'Runtime.exceptionThrown']
            status = 'OK ' if not bad else 'ERR'
            print(f'{status} {route}  title="{title}"' + (f'  ({len(bad)} errors)' if bad else ''))
            for e in bad[:3]:
                p = e.get('params', {})
                if e.get('method') == 'Runtime.exceptionThrown':
                    print('   EXC:', json.dumps(p.get('exceptionDetails', {}).get('text', ''))[:200])
                else:
                    args = [a.get('value', a.get('description', '')) for a in p.get('args', [])]
                    print('   CONSOLE:', str(args)[:200])
        # screenshot dashboard for a visual check
        js("history.pushState({}, '', '/app'); window.dispatchEvent(new PopStateEvent('popstate')); 'x'")
        time.sleep(2)
        i = send('Page.captureScreenshot', {'format': 'png'})
        r = recv_until([i], 10).get(i, {})
        data = ((r.get('result') or {}).get('result') or {}).get('data', '')
        if data:
            import base64
            open('/tmp/qa_dashboard.png', 'wb').write(base64.b64decode(data))
            print('screenshot -> /tmp/qa_dashboard.png')
    finally:
        chrome.terminate(); server.terminate()
    print(f'\nTotal console errors/exceptions: {len(errors)}')

main()
