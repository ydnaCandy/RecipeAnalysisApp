#!/bin/bash
set -e

# Initialize DB (using new path)
python backend/data/init_db.py

# Create test data (using new path)
python backend/data/create_test_data.py

# Start Server
exec "$@"
