# Project Setup and Execution Guide

## Prerequisites

Ensure the following are installed on your system:

* **Python 3.6+**: Required for the backend.
* **Node.js and npm**: Needed for the frontend.
* **Docker**: Utilized for running Redis.
* **Make**: Required to run Makefile commands.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/rohanchauhan02/integrations_technical_assessment.git
cd integrations_technical_assessment
```

### 2. Backend Setup

* Navigate to the backend directory:

  ```bash
  cd backend
  ```

* Create and activate a virtual environment:

  * On macOS/Linux:

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

  * On Windows:

    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

* Install the required packages:

  ```bash
  pip install -r requirements.txt
  ```

* Create a `.env` file inside the `backend` directory and add the following environment variables:

  ```env
  AIRTABLE_CLIENT_ID=XXXXXXX
  AIRTABLE_CLIENT_SECRET=XXXXXXX
  AIRTABLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/airtable

  HUBSPOT_CLIENT_ID=XXXXX
  HUBSPOT_CLIENT_SECRET=XXXXXXX
  HUBSPOT_REDIRECT_URI=http://localhost:8000/integrations/airtable/oauth2callback
  HUBSPOT_BASE_URL=https://app.hubspot.com

  NOTION_CLIENT_ID=XXXXX
  NOTION_CLIENT_SECRET=XXXX
  ```

### 3. Frontend Setup

* Navigate to the frontend directory:

  ```bash
  cd ../frontend
  ```

* Install the dependencies:

  ```bash
  npm install
  ```

### 4. Redis Setup

* Ensure Docker is running on your system.
* Pull and run the Redis Docker image:

  ```bash
  docker run --name redis-server -d -p 6379:6379 redis
  ```

  This command pulls the official Redis image and starts a container named `redis-server` in detached mode, mapping port 6379 of the container to port 6379 on your host machine.

## Running the Application

With all components set up, you can start the application using `Makefile` commands:

### 1. Start All Services

```bash
make start
```

This command starts Redis, the backend, and the frontend.

### 2. Start Individual Services

* Start Redis:

  ```bash
  make start-redis
  ```
* Start Backend:

  ```bash
  make start-be
  ```
* Start Frontend:

  ```bash
  make start-fe
  ```

### 3. Stop Redis

To stop and remove the Redis container:

```bash
make stop-redis
```

### 4. Clean Up

To remove generated files and dependencies:

```bash
make clean
```

This command stops Redis, removes virtual environments, clears cache files, and deletes `node_modules`.

## Additional Notes

- **Virtual Environment**: Always activate your Python virtual environment when working on the backend to ensure dependencies are managed correctly.
- **Environment Variables**: If your application relies on environment variables, a `.env` file will be created automatically in the backend directory using `make env`.
- **Makefile Convenience**: Instead of running multiple commands manually, use the `Makefile` to automate setup and execution.

This guide ensures a smooth setup and execution for your project using efficient command automation through `Makefile`.

