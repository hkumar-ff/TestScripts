from flask import Flask, request, jsonify, send_from_directory
import json
import os
import subprocess

app = Flask(__name__)

TEST_SUITES_FILE = 'testSuites.json'
EXECUTIONS_FILE = 'executions.json'

def load_test_suites():
    if os.path.exists(TEST_SUITES_FILE):
        with open(TEST_SUITES_FILE, 'r') as f:
            return json.load(f)
    return []

def save_test_suites(data):
    with open(TEST_SUITES_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_executions():
    if os.path.exists(EXECUTIONS_FILE):
        with open(EXECUTIONS_FILE, 'r') as f:
            return json.load(f)
    return {"executions": []}

def save_executions(data):
    with open(EXECUTIONS_FILE, 'w') as f:
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

    # Check if the script file exists in the testing-engine directory
    script_path = f'testing-engine/{data["name"]}'
    if not os.path.exists(script_path):
        return jsonify({'error': 'Script not found in the backend'}), 400

    new_case = {
        'id': str(len(suite['testCases']) + 1),
        'name': data['name'],
        'description': data['description'],
        'inputData': data.get('inputData', {})
    }
    suite['testCases'].append(new_case)
    save_test_suites(suites)
    return jsonify(new_case)

@app.route('/suites/<suite_id>/cases/<case_id>/run', methods=['POST'])
def run_test(suite_id, case_id):
    import datetime
    import time

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

    # Generate unique execution ID and directory with timestamp
    timestamp = int(time.time() * 1000)
    execution_id = f"exec_{timestamp}"
    screenshot_dir = f'testing-engine/screenshots/{suite_id}_{case_id}_{timestamp}'
    os.makedirs(screenshot_dir, exist_ok=True)

    try:
        test_url = request.json.get('url', '')
        if not test_url:
            return jsonify({'result': 'ERROR', 'message': 'Target URL not provided'}), 400

        input_data = request.json.get('inputData', {})
        # Save the input data to the test case for persistence
        test_case['inputData'] = input_data
        save_test_suites(suites)
        input_json = json.dumps(input_data)

        env = os.environ.copy()
        env['SCREENSHOT_DIR'] = screenshot_dir
        result = subprocess.run(['node', script_path, test_url, input_json], capture_output=True, text=True, timeout=600, env=env)

        # Determine result status
        if result.returncode == 0:
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

        # Save stdout logs to file
        logs_path = f'{screenshot_dir}/logs.txt'
        with open(logs_path, 'w') as f:
            f.write(result.stdout)

        logs_url = f'/screenshots/{suite_id}_{case_id}_{timestamp}/logs.txt'

        # Get list of screenshots
        screenshots = []
        for img in sorted(os.listdir(screenshot_dir)):
            if img.endswith('.png'):
                screenshots.append(f'/screenshots/{suite_id}_{case_id}_{timestamp}/{img}')

        # Save execution metadata
        executions_data = load_executions()
        execution_record = {
            "id": execution_id,
            "suiteId": suite_id,
            "caseId": case_id,
            "timestamp": datetime.datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "result": status,
            "message": message,
            "url": test_url,
            "screenshotsDir": f"{suite_id}_{case_id}_{timestamp}",
            "logsUrl": logs_url,
            "screenshots": screenshots
        }
        executions_data["executions"].append(execution_record)
        save_executions(executions_data)

        return jsonify({'result': status, 'message': message, 'screenshots': screenshots, 'logs': logs_url})
    except subprocess.TimeoutExpired:
        # Save timeout execution record
        executions_data = load_executions()
        execution_record = {
            "id": execution_id,
            "suiteId": suite_id,
            "caseId": case_id,
            "timestamp": datetime.datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "result": "TIMEOUT",
            "message": 'Script timed out after 300 seconds',
            "url": test_url,
            "screenshotsDir": f"{suite_id}_{case_id}_{timestamp}",
            "logsUrl": logs_url if 'logs_url' in locals() else None,
            "screenshots": screenshots if 'screenshots' in locals() else []
        }
        executions_data["executions"].append(execution_record)
        save_executions(executions_data)
        return jsonify({'result': 'TIMEOUT', 'message': 'Script timed out after 600 seconds', 'screenshots': screenshots, 'logs': logs_url})
    except Exception as e:
        # Save error execution record
        executions_data = load_executions()
        execution_record = {
            "id": execution_id,
            "suiteId": suite_id,
            "caseId": case_id,
            "timestamp": datetime.datetime.fromtimestamp(timestamp / 1000).isoformat(),
            "result": "ERROR",
            "message": f"Exception: {str(e)}",
            "url": test_url,
            "screenshotsDir": f"{suite_id}_{case_id}_{timestamp}",
            "logsUrl": logs_url if 'logs_url' in locals() else None,
            "screenshots": screenshots if 'screenshots' in locals() else []
        }
        executions_data["executions"].append(execution_record)
        save_executions(executions_data)
        return jsonify({'result': 'ERROR', 'message': f"Exception: {str(e)}", 'screenshots': screenshots if 'screenshots' in locals() else [], 'logs': logs_url if 'logs_url' in locals() else None})

@app.route('/suites/<suite_id>/cases/<case_id>/history')
def get_test_case_history(suite_id, case_id):
    executions_data = load_executions()
    # Filter executions for this test case and sort by timestamp descending
    case_executions = [exec for exec in executions_data["executions"]
                      if exec["suiteId"] == suite_id and exec["caseId"] == case_id]
    case_executions.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify(case_executions)

@app.route('/executions/<execution_id>')
def get_execution(execution_id):
    executions_data = load_executions()
    execution = next((exec for exec in executions_data["executions"] if exec["id"] == execution_id), None)
    if not execution:
        return jsonify({'error': 'Execution not found'}), 404
    return jsonify(execution)

@app.route('/suites/<suite_id>/cases/<case_id>/input', methods=['PUT'])
def update_test_case_input(suite_id, case_id):
    data = request.json
    suites = load_test_suites()
    suite = next((s for s in suites if s['id'] == suite_id), None)
    if not suite:
        return jsonify({'error': 'Suite not found'}), 404
    test_case = next((tc for tc in suite['testCases'] if tc['id'] == case_id), None)
    if not test_case:
        return jsonify({'error': 'Test case not found'}), 404

    test_case['inputData'] = data.get('inputData', {})
    save_test_suites(suites)
    return jsonify({'success': True})

@app.route('/screenshots/<path:filepath>')
def serve_screenshot(filepath):
    return send_from_directory('testing-engine/screenshots', filepath)

if __name__ == '__main__':
    app.run(debug=True)
