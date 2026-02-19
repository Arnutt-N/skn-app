#!/bin/bash
cd /mnt/d/genAI/skn-app/backend
source venv_linux/bin/activate
python -m pytest tests/ -v --tb=short 2>&1 > /mnt/d/genAI/skn-app/test-results.txt
echo "TESTS_COMPLETE" >> /mnt/d/genAI/skn-app/test-results.txt
