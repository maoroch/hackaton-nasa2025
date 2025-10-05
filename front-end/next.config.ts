import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Отключаем dev overlay
    reactRefresh: false,
  },
  // Или для более новых версий
  devIndicators: {
    appIsrStatus: false,
  }
}

module.exports = nextConfig