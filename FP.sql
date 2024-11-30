DROP DATABASE IF EXISTS `RetailDB`;
CREATE DATABASE `RetailDB`;
USE `RetailDB`;


CREATE TABLE Categories(
CategoryID INT AUTO_INCREMENT PRIMARY KEY,
CategoryName VARCHAR(100) NOT NULL,
Description TEXT
);

CREATE TABLE Products(
ProductID INT AUTO_INCREMENT PRIMARY KEY,
CategoryID INT,
ProductName VARCHAR(255) NOT NULL,
Description TEXT,
Price Decimal(10,2) NOT NULL,
StockQuantity INT NOT NULL,
FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Customers(
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20),
    Address VARCHAR(255),
    Password VARCHAR(255) NOT NULL, -- Added password field
    CONSTRAINT Check_CustomerEmail CHECK (Email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    CONSTRAINT Check_CustomerPhoneNumber CHECK (PhoneNumber REGEXP '^[0-9]{10,15}$'),
    CONSTRAINT Check_PasswordStrength CHECK (CHAR_LENGTH(Password) >= 8) -- Ensure a minimum length of 8 characters
);


CREATE TABLE Orders(
OrderID INT AUTO_INCREMENT PRIMARY KEY,
CustomerID INT,
OrderDate DATETIME NOT NULL,
TotalPrice DECIMAL(10,2) NOT NULL,
ShippingAddress VARCHAR(255) NOT NULL,
Status VARCHAR(55) NOT NULL,
FOREIGN KEY (CustomerID) References Customers(CustomerID) 
);



