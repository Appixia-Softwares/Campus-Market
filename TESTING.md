# Testing Guide 🧪

This guide covers testing strategies, tools, and best practices for Campus Market.

## 📋 Testing Overview

### Testing Pyramid

```
    E2E Tests (Few)
       /    \
      /      \
   Integration Tests (Some)
      /    \
     /      \
  Unit Tests (Many)
```

### Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Visual Regression Tests**: Test UI consistency

## 🛠️ Testing Tools

### Core Testing Libraries

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Additional Tools

- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: E2E testing
- **Storybook**: Component testing
- **Cypress**: Alternative E2E testing

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

### 2. Configure Jest

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### 3. Setup Test Environment

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))
```

### 4. Add Test Scripts

Update `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 🧪 Unit Testing

### Component Testing

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies disabled state correctly', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })
})
```

### Hook Testing

```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('handles login correctly', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toBeTruthy()
  })
})
```

### Utility Function Testing

```typescript
// lib/utils.test.ts
import { formatPrice, validateEmail } from './utils'

describe('utils', () => {
  describe('formatPrice', () => {
    it('formats price correctly', () => {
      expect(formatPrice(1000)).toBe('$10.00')
      expect(formatPrice(150)).toBe('$1.50')
    })

    it('handles zero price', () => {
      expect(formatPrice(0)).toBe('$0.00')
    })
  })

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })
  })
})
```

## 🔗 Integration Testing

### API Route Testing

```typescript
// app/api/products/route.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from './route'

describe('/api/products', () => {
  it('GET returns products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    await GET(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.products).toBeDefined()
  })

  it('POST creates new product', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test Product',
        price: 100,
        description: 'Test description',
      },
    })

    await POST(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.title).toBe('Test Product')
  })
})
```

### Component Integration Testing

```typescript
// components/ProductForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductForm } from './ProductForm'

describe('ProductForm', () => {
  it('submits form with correct data', async () => {
    const onSubmit = jest.fn()
    render(<ProductForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Product' },
    })
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' },
    })

    fireEvent.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Product',
        price: 100,
        description: 'Test description',
      })
    })
  })
})
```

## 🌐 E2E Testing

### Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Basic E2E Test

```typescript
// tests/e2e/product-creation.spec.ts
import { test, expect } from '@playwright/test'

test('user can create a product', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3000')

  // Login
  await page.click('text=Login')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('text=Sign In')

  // Navigate to create product
  await page.click('text=Create Listing')
  
  // Fill product form
  await page.fill('[data-testid="product-title"]', 'Test Product')
  await page.fill('[data-testid="product-price"]', '100')
  await page.fill('[data-testid="product-description"]', 'Test description')
  
  // Submit form
  await page.click('text=Create Product')
  
  // Verify product was created
  await expect(page.locator('text=Test Product')).toBeVisible()
  await expect(page.locator('text=$100')).toBeVisible()
})
```

### Test Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 🎨 Visual Testing

### Storybook Setup

```bash
npm install --save-dev @storybook/nextjs @storybook/react @storybook/addon-essentials
npx storybook@latest init
```

### Component Story

```typescript
// components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
}

export const Large: Story = {
  args: {
    children: 'Button',
    size: 'lg',
  },
}
```

## 🧹 Test Utilities

### Custom Render Function

```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data

```typescript
// mocks/data.ts
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
}

export const mockProduct = {
  id: 'product-1',
  title: 'Test Product',
  description: 'Test description',
  price: 100,
  category: 'electronics',
  condition: 'new',
  images: ['https://example.com/image.jpg'],
  seller: mockUser,
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockProducts = [mockProduct]
```

## 📊 Coverage

### Coverage Configuration

Update `jest.config.js`:

```javascript
const customJestConfig = {
  // ... other config
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## 🚀 CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm test

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 🐛 Debugging Tests

### Debugging Unit Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npm test -- --testNamePattern="Button"
```

### Debugging E2E Tests

```bash
# Run tests in headed mode
npx playwright test --headed

# Run tests with debug
npx playwright test --debug

# Run tests with UI
npx playwright test --ui
```

## 📚 Best Practices

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/
│   ├── api/
│   └── components/
└── e2e/
    ├── auth/
    ├── products/
    └── messaging/
```

### Naming Conventions

```typescript
// Component test
describe('Button', () => {
  it('should render with correct text')
  it('should call onClick when clicked')
  it('should be disabled when disabled prop is true')
})

// Hook test
describe('useAuth', () => {
  it('should return initial state')
  it('should update user on login')
  it('should clear user on logout')
})

// Utility test
describe('formatPrice', () => {
  it('should format price correctly')
  it('should handle zero price')
  it('should handle negative price')
})
```

### Test Data Management

```typescript
// Use factories for test data
const createUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
})

const createProduct = (overrides = {}) => ({
  id: 'product-1',
  title: 'Test Product',
  price: 100,
  ...overrides,
})
```

## 📞 Support

### Getting Help

- **Testing Library Docs**: https://testing-library.com/docs/
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Storybook Docs**: https://storybook.js.org/docs/react/get-started/introduce

### Common Issues

1. **Async Testing**: Use `waitFor` for async operations
2. **Mocking**: Mock external dependencies
3. **Cleanup**: Clean up after each test
4. **Isolation**: Tests should be independent

---

*Happy testing! 🧪✨* 