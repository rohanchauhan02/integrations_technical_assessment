.PHONY: start start-be start-fe start-redis stop-redis env clean

# Create and set permissions for the environment file
env:
	cd backend && \
	if [ ! -f .env ]; then \
		cp .sample.env .env && \
		echo ".env file created from .sample.env"; \
	else \
		echo ".env file already exists"; \
	fi

# Start all services
start: start-redis start-be start-fe

# Start the Redis container
start-redis:
	docker run --name redis-server -d -p 6379:6379 redis

# Stop and remove the Redis container
stop-redis:
	docker stop redis-server || true
	docker rm redis-server || true

# Set up and start the backend
start-be: 
	cd backend && \
	python3 -m venv venv && \
	. venv/bin/activate && \
	pip install -r requirements.txt && \
	uvicorn main:app --reload

# Set up and start the frontend
start-fe:
	cd frontend && \
	npm install && \
	npm start

# Clean up generated files and directories
clean: stop-redis
	cd backend && \
	rm -rf venv .env && \
	find . -type d -name '__pycache__' -exec rm -r {} + && \
	find . -type d -name '*.egg-info' -exec rm -r {} + && \
	find . -type d -name 'dist' -exec rm -r {} + && \
	find . -type d -name 'build' -exec rm -r {} + && \
	find . -type f -name '*.pyc' -delete
	cd frontend && \
	rm -rf node_modules


