USE vulnerable_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, password, email, is_admin) VALUES 
(1, 'admin', 'admin', 'admin@company.com', TRUE)
ON DUPLICATE KEY UPDATE username=username;
INSERT INTO users (id, username, password, email, is_admin) VALUES 
(2, 'douglas_w', 'senha123', 'douglas@company.com', FALSE)
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (id, username, password, email, is_admin) VALUES 
(3, 'teste_sqli', '123456', 'sqli@company.com', FALSE)
ON DUPLICATE KEY UPDATE username=username;