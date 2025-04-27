#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start backend
echo "Starting backend..."
cd apps/backend
pnpm dev &

# Start frontend
echo "Starting frontend..."
cd ../frontend
pnpm dev &

# Wait for both processes
wait 