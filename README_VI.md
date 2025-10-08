# 📝 Ứng Dụng Quản Lý Công Việc Cá Nhân

Một ứng dụng quản lý công việc (Todo List) hoàn chỉnh và thân thiện với người dùng, được xây dựng bằng Next.js 14, có tính năng xác thực người dùng, giao diện hiện đại và lưu trữ dữ liệu bền vững.

## ✨ Tính Năng Chính

- **🔐 Xác Thực Người Dùng**: Đăng nhập và đăng ký an toàn với NextAuth.js
- **📝 Quản Lý Công Việc**: Tạo, xem, cập nhật và xóa các công việc
- **🎯 Mức Độ Ưu Tiên**: Đặt mức độ ưu tiên (Thấp, Trung Bình, Cao) cho công việc
- **📂 Phân Loại**: Tổ chức công việc theo danh mục tùy chỉnh
- **📅 Ngày Hạn**: Đặt và theo dõi ngày hạn hoàn thành
- **✅ Đánh Dấu Hoàn Thành**: Theo dõi trạng thái hoàn thành công việc
- **🌙 Chế Độ Tối**: Chuyển đổi giữa giao diện sáng và tối
- **📱 Thiết Kế Responsive**: Hoạt động hoàn hảo trên máy tính và điện thoại
- **🎨 Giao Diện Hiện Đại**: Giao diện sạch sẽ, trực quan được xây dựng với Tailwind CSS
- **⚡ Hiệu Suất Cao**: Được xây dựng với Next.js 14 App Router

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Xác Thực**: NextAuth.js
- **Cơ Sở Dữ Liệu**: Prisma ORM với SQLite (dev) / PostgreSQL (production)
- **UI Components**: Các component tùy chỉnh được xây dựng với Radix primitives
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🛠️ Cài Đặt & Thiết Lập

### Yêu Cầu Hệ Thống

- Node.js 18+ 
- npm hoặc yarn

### Phát Triển Local

1. **Clone repository**
   ```bash
   git clone https://github.com/TRIBUI106/czToDo.git
   cd czToDoList
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường**
   Tạo file `.env` trong thư mục gốc:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   ```

4. **Thiết lập cơ sở dữ liệu**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Khởi động server phát triển**
   ```bash
   npm run dev
   ```

6. **Mở trình duyệt**
   Truy cập [http://localhost:3000](http://localhost:3000)

## 📖 Hướng Dẫn Sử Dụng

### Bắt Đầu

1. **Đăng Ký Tài Khoản**: Tạo tài khoản mới với email và mật khẩu
2. **Đăng Nhập**: Đăng nhập bằng thông tin đăng nhập của bạn
3. **Thêm Công Việc Đầu Tiên**: Nhấp "Thêm Công Việc Mới" và điền thông tin
4. **Tổ Chức**: Sử dụng danh mục, mức độ ưu tiên và ngày hạn để sắp xếp
5. **Theo Dõi Tiến Độ**: Đánh dấu công việc hoàn thành khi xong

### Hướng Dẫn Tính Năng

- **Thêm Công Việc**: Điền form với tiêu đề, mô tả, danh mục, mức độ ưu tiên và ngày hạn
- **Chỉnh Sửa**: Nhấp biểu tượng chỉnh sửa để thay đổi tiêu đề công việc
- **Hoàn Thành**: Nhấp biểu tượng tick để đánh dấu công việc hoàn thành
- **Xóa**: Nhấp biểu tượng thùng rác để xóa vĩnh viễn công việc
- **Chế Độ Tối**: Sử dụng nút chuyển đổi theme ở góc trên bên phải

## 🚀 Triển Khai

### Triển Khai lên Vercel

1. **Push lên GitHub**: Đảm bảo code đã được push lên GitHub repository

2. **Kết nối với Vercel**:
   - Truy cập [vercel.com](https://vercel.com)
   - Import GitHub repository của bạn
   - Vercel sẽ tự động nhận diện đây là project Next.js

3. **Cấu hình Biến Môi Trường** trong Vercel Dashboard:
   ```env
   DATABASE_URL=your-production-database-url
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXTAUTH_SECRET=your-production-secret-key
   ```

4. **Thiết lập Cơ Sở Dữ Liệu Production**:
   - Đối với PostgreSQL, bạn có thể sử dụng các dịch vụ như:
     - [Neon](https://neon.tech/) (khuyến nghị)
     - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
     - [Supabase](https://supabase.com/)
     - [PlanetScale](https://planetscale.com/)

5. **Deploy**: Vercel sẽ tự động triển khai ứng dụng của bạn

## 🗂️ Cấu Trúc Dự Án

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Endpoints xác thực
│   │   └── todos/         # Endpoints CRUD cho todos
│   ├── auth/              # Trang xác thực
│   ├── dashboard/         # Dashboard chính quản lý todos
│   ├── globals.css        # Styles toàn cục
│   ├── layout.tsx         # Layout gốc
│   └── page.tsx           # Trang chủ
├── components/            # Components có thể tái sử dụng
│   ├── ui/               # UI components
│   ├── providers.tsx     # Context providers
│   └── theme-toggle.tsx  # Chuyển đổi theme
├── lib/                  # Thư viện tiện ích
│   ├── auth.ts          # Cấu hình NextAuth
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript definitions
```

## 🔒 Tính Năng Bảo Mật

- **Mã Hóa Mật Khẩu**: Mật khẩu được mã hóa an toàn bằng bcryptjs
- **Quản Lý Session**: Session JWT an toàn với NextAuth.js
- **Bảo Vệ CSRF**: Bảo vệ CSRF tích hợp với NextAuth.js
- **Biến Môi Trường**: Dữ liệu nhạy cảm được lưu trữ trong biến môi trường
- **Validation Input**: Validation phía server cho tất cả input từ người dùng

## 📝 API Endpoints

### Xác Thực
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/[...nextauth]` - Endpoints NextAuth.js

### Todos
- `GET /api/todos` - Lấy todos của user (có filtering)
- `POST /api/todos` - Tạo todo mới
- `GET /api/todos/[id]` - Lấy todo cụ thể
- `PUT /api/todos/[id]` - Cập nhật todo
- `DELETE /api/todos/[id]` - Xóa todo

---

Được xây dựng với ❤️ để nâng cao năng suất cá nhân