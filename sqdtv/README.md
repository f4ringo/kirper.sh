# SQDTV - Social Canvas Web Application

A real-time social canvas application built with Vue 3, Fastify, and WebSocket.

## 🚀 Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + Fastify (TypeScript)
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Real-time**: WebSocket
- **Package Manager**: pnpm

## 📁 Project Structure

```
sqdtv/
├── apps/
│   ├── frontend/     # Vue 3 + TypeScript frontend application
│   └── backend/      # Fastify backend server
├── packages/         # Shared packages and utilities
└── package.json      # Root package.json for workspace management
```

## 🛠️ Development Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sqdtv.git
cd sqdtv
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### Running the Application

1. Start the backend server:
```bash
cd apps/backend
pnpm dev
```

2. Start the frontend development server:
```bash
cd apps/frontend
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run frontend tests
cd apps/frontend && pnpm test

# Run backend tests
cd apps/backend && pnpm test
```

## 📦 Building for Production

```bash
# Build all packages
pnpm build

# Build frontend only
cd apps/frontend && pnpm build

# Build backend only
cd apps/backend && pnpm build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 