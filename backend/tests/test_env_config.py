import os

from backend.env_config import load_project_env


def test_loads_bom_and_quotes_without_expansion_or_overriding(tmp_path, monkeypatch):
    env = tmp_path / '.env'
    env.write_text('\ufeffT2F_TEST_VALUE="from file"\nT2F_TEST_LITERAL=\'${T2F_TEST_VALUE}\'\nT2F_TEST_EXISTING=file\n', encoding='utf-8')
    monkeypatch.delenv('T2F_TEST_VALUE', raising=False)
    monkeypatch.delenv('T2F_TEST_LITERAL', raising=False)
    monkeypatch.setenv('T2F_TEST_EXISTING', 'process')
    load_project_env(env, ignore_skip=True)
    assert os.environ['T2F_TEST_VALUE'] == 'from file'
    assert os.environ['T2F_TEST_LITERAL'] == '${T2F_TEST_VALUE}'
    assert os.environ['T2F_TEST_EXISTING'] == 'process'
    monkeypatch.delenv('T2F_TEST_VALUE')
    monkeypatch.delenv('T2F_TEST_LITERAL')


def test_skip_and_missing_file(tmp_path, monkeypatch):
    env = tmp_path / '.env'
    env.write_text('T2F_TEST_SKIP=loaded\n', encoding='utf-8')
    monkeypatch.delenv('T2F_TEST_SKIP', raising=False)
    monkeypatch.setenv('T2F_SKIP_ENV_FILE', '1')
    load_project_env(env)
    assert 'T2F_TEST_SKIP' not in os.environ
    load_project_env(tmp_path / 'missing', ignore_skip=True)
    assert 'T2F_TEST_SKIP' not in os.environ
