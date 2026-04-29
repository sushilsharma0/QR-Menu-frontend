import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  FiMail,
  FiLock,
  FiUsers,
  FiUserCheck,
  FiUser,
  FiHome,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

const Login = () => {
  const { login } = useAuth();
  const [role, setRole] = useState("restaurant");
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (role === "platform") {
        await login(data.email, data.password, "platform");
      } else if (role === "restaurant") {
        await login(data.email, data.password, "restaurant");
      } else if (role === "employee") {
        await login(
          data.username,
          data.password,
          "employee",
          data.restaurantId,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <FiHome className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QR Menu SaaS</h1>
          <p className="text-gray-500 mt-2">Login to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Role Selection Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setRole("platform")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-sm font-medium ${
                role === "platform"
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FiUserCheck className="h-4 w-4" />
              <span>Platform</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("restaurant")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-sm font-medium ${
                role === "restaurant"
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FiUsers className="h-4 w-4" />
              <span>Restaurant</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("employee")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-sm font-medium ${
                role === "employee"
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FiUser className="h-4 w-4" />
              <span>Employee</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Platform & Restaurant: Email Field */}
            {(role === "platform" || role === "restaurant") && (
              <Input
                label="Email Address"
                icon={FiMail}
                type="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
                error={errors.email?.message}
              />
            )}

            {/* Employee: Username & Restaurant ID Fields */}
            {role === "employee" && (
              <>
                <Input
                  label="Username"
                  icon={FiUser}
                  placeholder="Enter your username"
                  {...register("username", {
                    required: "Username is required",
                  })}
                  error={errors.username?.message}
                />
                <Input
                  label="Restaurant ID"
                  icon={FiUsers}
                  placeholder="Enter restaurant ID"
                  {...register("restaurantId", {
                    required: "Restaurant ID is required",
                  })}
                  error={errors.restaurantId?.message}
                />
              </>
            )}

            {/* Password Field */}
            <Input
              label="Password"
              icon={FiLock}
              type="password"
              placeholder="Enter your password"
              {...register("password", { required: "Password is required" })}
              error={errors.password?.message}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3">
              Sign In
            </Button>
          </form>

          {/* Register Link - Only for Restaurant */}
          {role === "restaurant" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Register as Restaurant
                </Link>
              </p>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              📋 Demo Credentials
            </p>

            {role === "platform" && (
              <div className="space-y-1 text-xs">
                <p className="text-gray-600">👑 Super Admin</p>
                <p className="font-mono text-gray-500">
                  Email: superadmin@qrmenu.com
                </p>
                <p className="font-mono text-gray-500">Password: Admin@123</p>
              </div>
            )}

            {role === "restaurant" && (
              <div className="space-y-1 text-xs">
                <p className="text-gray-600">🍽️ Restaurant Owner</p>
                <p className="font-mono text-gray-500">
                  Email: test@restaurant.com
                </p>
                <p className="font-mono text-gray-500">Password: Test@123456</p>
                <p className="text-yellow-600 mt-1">
                  ⚠️ Register first if not exists
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
