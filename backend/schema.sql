-- ============================================================
-- CareerKit database schema
-- Maps 1:1 to the Chen ERD: users -> resumes -> resume_versions
-- -> { education, experience, projects, skills }
-- Run this once in phpMyAdmin (XAMPP) or:  mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS careerkit
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE careerkit;

-- USER ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESUME -------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(150) NOT NULL,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RESUME_VERSION ----------------------------------------------
CREATE TABLE IF NOT EXISTS resume_versions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  resume_id      INT NOT NULL,
  version_number INT NOT NULL,
  contact_info   TEXT,
  summary        TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- EDUCATION ----------------------------------------------------
CREATE TABLE IF NOT EXISTS education (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version_id  INT NOT NULL,
  institution VARCHAR(150),
  degree      VARCHAR(150),
  start_date  VARCHAR(40),
  end_date    VARCHAR(40),
  FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
);

-- EXPERIENCE ---------------------------------------------------
CREATE TABLE IF NOT EXISTS experience (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version_id  INT NOT NULL,
  company     VARCHAR(150),
  role        VARCHAR(150),
  description TEXT,
  start_date  VARCHAR(40),
  end_date    VARCHAR(40),
  FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
);

-- PROJECT ------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version_id  INT NOT NULL,
  name        VARCHAR(150),
  description TEXT,
  link        VARCHAR(255),
  FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
);

-- SKILL --------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  version_id INT NOT NULL,
  name       VARCHAR(100),
  category   VARCHAR(80),
  FOREIGN KEY (version_id) REFERENCES resume_versions(id) ON DELETE CASCADE
);
