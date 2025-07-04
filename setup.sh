#!/bin/bash

echo "🚀 Setting up My Friend Glu Backend"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📦 Installing Node.js using Homebrew..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install Node.js
    brew install node
    
    echo "✅ Node.js installed successfully!"
else
    echo "✅ Node.js is already installed: $(node --version)"
fi

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "✅ npm is available: $(npm --version)"
else
    echo "❌ npm is not available. Please install Node.js properly."
    exit 1
fi

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (generate a secure random string)
JWT_SECRET="$(openssl rand -base64 32)"

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY="your-openai-api-key-here"

# App Configuration
NODE_ENV="development"
EOF
    echo "✅ .env.local created with default values"
    echo "⚠️  Please update OPENAI_API_KEY with your actual API key"
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo "🗄️  Setting up database..."
npx prisma generate

# Push database schema
echo "📊 Creating database tables..."
npx prisma db push

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update .env.local with your OpenAI API key"
echo "2. Run 'npm run dev' to start the development server"
echo "3. The API will be available at http://localhost:3000/api/"
echo ""
echo "Available commands:"
echo "- npm run dev: Start development server"
echo "- npm run build: Build for production"
echo "- npm run db:studio: Open Prisma Studio"
echo "- npm run db:push: Update database schema"
echo ""
echo "📚 See BACKEND_README.md for detailed API documentation" 