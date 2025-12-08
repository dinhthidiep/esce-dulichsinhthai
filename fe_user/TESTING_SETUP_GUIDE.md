# Hướng dẫn Setup Testing Framework cho Booking History

## Bước 1: Cài đặt Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

## Bước 2: Cấu hình Vitest

Tạo file `vitest.config.ts` trong thư mục `fe_user`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Bước 3: Tạo Test Setup File

Tạo file `src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect với jest-dom matchers
expect.extend(matchers);

// Cleanup sau mỗi test
afterEach(() => {
  cleanup();
});
```

## Bước 4: Cập nhật package.json

Thêm script test vào `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Bước 5: Tạo Type Definitions

Tạo file `src/test/vitest.d.ts` (nếu cần):

```typescript
import '@testing-library/jest-dom';
```

## Bước 6: Cấu hình TypeScript

Đảm bảo `tsconfig.json` bao gồm types cho vitest:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## Bước 7: Tạo Mock Utilities

Tạo file `src/test/mocks/axiosInstance.ts`:

```typescript
import { vi } from 'vitest';

export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

vi.mock('../../utils/axiosInstance', () => ({
  default: mockAxiosInstance,
}));
```

Tạo file `src/test/mocks/reactRouter.ts`:

```typescript
import { vi } from 'vitest';

export const mockNavigate = vi.fn();
export const mockLocation = { state: null, pathname: '/profile' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({}),
  };
});
```

## Bước 8: Tạo Test Helper Functions

Tạo file `src/test/helpers/bookingHelpers.ts`:

```typescript
export const createMockBooking = (overrides = {}) => ({
  Id: 1,
  Status: 'confirmed',
  BookingDate: '2024-01-01T00:00:00',
  StartDate: '2024-01-15T00:00:00',
  EndDate: '2024-01-20T00:00:00',
  Quantity: 2,
  TotalAmount: 1000000,
  ServiceCombo: {
    Id: 1,
    Name: 'Tour Đà Lạt',
    Image: 'tour-dalat.jpg',
  },
  ...overrides,
});

export const createMockUserInfo = (overrides = {}) => ({
  Id: 1,
  Name: 'Test User',
  Email: 'test@example.com',
  ...overrides,
});
```

## Bước 9: Chạy Test

```bash
# Chạy test một lần
npm test

# Chạy test với UI
npm run test:ui

# Chạy test ở chế độ watch
npm run test:watch

# Chạy test với coverage
npm run test:coverage
```

## Cấu trúc thư mục đề xuất

```
fe_user/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── ProfilePage.test.tsx
│   │   │   └── BookingHistory.test.tsx
│   │   └── ProfilePage.tsx
│   └── test/
│       ├── setup.ts
│       ├── mocks/
│       │   ├── axiosInstance.ts
│       │   └── reactRouter.ts
│       └── helpers/
│           └── bookingHelpers.ts
├── vitest.config.ts
└── package.json
```

## Lưu ý quan trọng

1. **Mock localStorage/sessionStorage**: Sử dụng `localStorageMock` trong test
2. **Mock window.confirm**: Mock `window.confirm` để không hiển thị dialog thật
3. **Async Testing**: Luôn sử dụng `waitFor` khi test async operations
4. **Cleanup**: Đảm bảo cleanup sau mỗi test để tránh side effects
5. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào test khác

## Troubleshooting

### Lỗi: "Cannot find module '@testing-library/jest-dom'"
```bash
npm install --save-dev @testing-library/jest-dom
```

### Lỗi: "ReferenceError: window is not defined"
- Đảm bảo `environment: 'jsdom'` trong `vitest.config.ts`

### Lỗi: "Cannot find module 'react-router-dom'"
- Mock react-router-dom đúng cách như trong `src/test/mocks/reactRouter.ts`

### Lỗi: "Type error with vitest globals"
- Thêm `"types": ["vitest/globals"]` vào `tsconfig.json`

## Tài liệu tham khảo

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Jest DOM](https://github.com/testing-library/jest-dom)







