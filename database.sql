-- ============================================================
-- TAILOR SHOP MANAGEMENT SYSTEM - DATABASE SETUP
-- WAMP Server MySQL me ye file import karo
-- phpMyAdmin > Import > is file ko select karo
-- ============================================================

CREATE DATABASE IF NOT EXISTS tailor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tailor_db;

-- ========== TAILORS TABLE (Registration/Login) ==========
CREATE TABLE IF NOT EXISTS tailors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  shop_name   VARCHAR(100) NOT NULL,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(15),
  address     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== CUSTOMERS TABLE ==========
CREATE TABLE IF NOT EXISTS customers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tailor_id   INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15)  NOT NULL,
  address     TEXT,
  notes       TEXT,
  total_price DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tailor_id) REFERENCES tailors(id) ON DELETE CASCADE
);

-- ========== MEASUREMENTS TABLE ==========
CREATE TABLE IF NOT EXISTS measurements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  type         ENUM('salwar','kameez','shirt','pant') NOT NULL,
  field_name   VARCHAR(50) NOT NULL,
  field_value  DECIMAL(6,2),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ========== CUSTOM MEASUREMENTS TABLE (Extra Nap Fields) ==========
CREATE TABLE IF NOT EXISTS custom_measurements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  type         VARCHAR(20) NOT NULL,
  field_name   VARCHAR(100) NOT NULL,
  field_value  DECIMAL(6,2),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ========== PAYMENTS TABLE ==========
CREATE TABLE IF NOT EXISTS payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  paid_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
