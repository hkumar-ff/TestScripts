from flask import Flask, request, jsonify, send_from_directory
import json
import os
import subprocess

app = Flask(__name__)

TEST_SUITES_FILE = 'testSuites.json'

def load_test_suites():
    if os.path.exists(TEST_SUITES_FILE):
        with open(TEST_SUITES_FILE, 'r') as f:
            return json.load(f)
    return []

def save_test_suites(data):
    with open(TEST_SUITES_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/suites')
def get_suites():
    suites = load_test_suites()
    return jsonify(suites)

@app.route('/suites', methods=['POST'])
def create_suite():
    data = request.json
    suites = load_test_suites()
    new_suite = {
        'id': str(len(suites) + 1),
        'name': data['name'],
        'testCases': data.get('testCases', [])
    }
    suites.append(new_suite)
    save_test_suites(suites)
    return jsonify(new_suite)

@app.route('/suites/<suite_id>')
def get_suite(suite_id):
    suites = load_test_suites()
    suite = next((s for s in suites if s['id'] == suite_id), None)
    if not suite:
        return jsonify({'error': 'Suite not found'}), 404
    return jsonify(suite)

@app.route('/suites/<suite_id>/cases', methods=['POST'])
def add_test_case(suite_id):
    data = request.json
    suites = load_test_suites()
    suite = next((s for s in suites if s['id'] == suite_id), None)
    if not suite:
        return jsonify({'error': 'Suite not found'}), 404
    new_case = {
        'id': str(len(suite['testCases']) + 1),
        'name': data['name'],
        'description': data['description']
    }
    suite['testCases'].append(new_case)
    save_test_suites(suites)
    return jsonify(new_case)

@app.route('/suites/<suite_id>/cases/<case_id>/run', methods=['POST'])
def run_test(suite_id, case_id):
    suites = load_test_suites()
    suite = next((s for s in suites if s['id'] == suite_id), None)
    if not suite:
        return jsonify({'error': 'Suite not found'}), 404
    test_case = next((tc for tc in suite['testCases'] if tc['id'] == case_id), None)
    if not test_case:
        return jsonify({'error': 'Test case not found'}), 404
    script_path = f'testing-engine/{test_case["name"]}'
    if not os.path.exists(script_path):
        return jsonify({'error': 'Script file not found'}), 404

    # Create screenshots folder
    screenshot_dir = f'testing-engine/screenshots/{suite_id}_{case_id}'
    os.makedirs(screenshot_dir, exist_ok=True)

    try:
        test_url = request.json.get('url', '')
        if not test_url:
            return jsonify({'result': 'ERROR', 'message': 'Target URL not provided'}), 400
        env = os.environ.copy()
        env['SCREENSHOT_DIR'] = screenshot_dir
        result = subprocess.run(['node', script_path, test_url], capture_output=True, text=True, timeout=300, env=env)

        # Save stdout logs to file
        with open(f'{screenshot_dir}/logs.txt', 'w') as f:
            f.write(result.stdout)

        logs_url = f'/screenshots/{suite_id}_{case_id}/logs.txt'

        # Get list of screenshots
        screenshots = [f'/screenshots/{suite_id}_{case_id}/{img}' for img in os.listdir(screenshot_dir) if img.endswith('.png')]
        screenshots.sort()  # Sort by filename (timestamp)

        if result.returncode == 0:
            # Check for PASS or FAIL in stdout
            if 'PASS' in result.stdout:
                status = 'PASS'
                message = None
            elif 'FAIL' in result.stdout:
                status = 'FAIL'
                message = result.stdout.strip()
            else:
                status = 'UNKNOWN'
                message = f"No PASS/FAIL found in output. Stdout: {result.stdout}"
        else:
            status = 'ERROR'
            message = f"Script exited with code {result.returncode}"
            if result.stdout:
                message += f"\nStdout: {result.stdout}"
            if result.stderr:
                message += f"\nStderr: {result.stderr}"

        return jsonify({'result': status, 'message': message, 'screenshots': screenshots, 'logs': logs_url})
    except subprocess.TimeoutExpired:
        return jsonify({'result': 'TIMEOUT', 'message': 'Script timed out after 300 seconds', 'screenshots': [], 'logs': logs_url})
    except Exception as e:
        return jsonify({'result': 'ERROR', 'message': f"Exception: {str(e)}", 'screenshots': [], 'logs': logs_url})

@app.route('/screenshots/<path:filepath>')
def serve_screenshot(filepath):
    return send_from_directory('testing-engine/screenshots', filepath)

if __name__ == '__main__':
    app.run(debug=True)
