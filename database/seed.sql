-- DEV ONLY: admin@nova.test / admin123, staff@nova.test / staff123
CREATE EXTENSION IF NOT EXISTS pgcrypto;
TRUNCATE inventory_logs, sales, customers, products, users RESTART IDENTITY CASCADE;
INSERT INTO users(name,email,password_hash,role) VALUES
 ('Rina Admin','admin@nova.test',crypt('admin123',gen_salt('bf')),'admin'),
 ('Dimas Staff','staff@nova.test',crypt('staff123',gen_salt('bf')),'staff');
INSERT INTO products(name,sku,category,price,stock,created_by) VALUES
 ('Kopi Arabika Gayo 250g','BEV-001','Beverage',85000,60,1),
 ('Kopi Robusta Lampung 250g','BEV-002','Beverage',55000,45,1),
 ('Teh Melati Premium 100g','BEV-003','Beverage',38000,8,1),
 ('Cokelat Bubuk Dairy 500g','BEV-004','Beverage',72000,0,1),
 ('Gula Aren Cair 500ml','FOD-001','Food',32000,50,1),
 ('Madu Hutan Sumbawa 350ml','FOD-002','Food',95000,30,1),
 ('Keripik Tempe Original','FOD-003','Food',18000,80,1),
 ('Sambal Roa Botol 200g','FOD-004','Food',42000,6,1),
 ('Beras Organik 5kg','FOD-005','Food',89000,40,1),
 ('Minyak Kelapa Murni 500ml','FOD-006','Food',65000,25,1),
 ('Buku Catatan A5','OFC-001','Office',28000,100,1),
 ('Pulpen Gel Hitam (12 pcs)','OFC-002','Office',36000,70,1),
 ('Kertas HVS A4 70gr (500)','OFC-003','Office',52000,35,1),
 ('Map Plastik Folio (10 pcs)','OFC-004','Office',24000,9,1),
 ('Tas Totebag Kanvas','MRC-001','Merchandise',45000,55,1),
 ('Kaos Katun Combed M','MRC-002','Merchandise',99000,40,1),
 ('Tumbler Stainless 500ml','MRC-003','Merchandise',125000,28,1),
 ('Topi Baseball Hitam','MRC-004','Merchandise',68000,3,1),
 ('Lilin Aromaterapi Lavender','HOM-001','Home',58000,32,1),
 ('Gelas Keramik Handmade','HOM-002','Home',48000,42,1);
INSERT INTO customers(name,email,phone) VALUES
 ('Budi Santoso','budi.santoso@example.com','081210000001'),
 ('Siti Rahmawati','siti.rahma@example.com','081210000002'),
 ('Andi Pratama','andi.pratama@example.com','081210000003'),
 ('Dewi Lestari','dewi.lestari@example.com','081210000004'),
 ('Agus Wijaya','agus.wijaya@example.com','081210000005'),
 ('Maya Putri','maya.putri@example.com','081210000006'),
 ('Hendra Kusuma','hendra.kusuma@example.com','081210000007'),
 ('Lina Marlina','lina.marlina@example.com','081210000008'),
 ('Fajar Nugroho','fajar.nugroho@example.com','081210000009'),
 ('Raihan Fradita','raihan.fradita@example.com','081210000010');
INSERT INTO inventory_logs(product_id,type,quantity,note,created_at)
 SELECT id,'IN',stock+30,'Initial stock',now()-interval '40 days' FROM products;
UPDATE products SET stock = stock + 30;
DO $$
DECLARE p products%ROWTYPE; q INT; t TIMESTAMPTZ; sid INT;
BEGIN
  FOR i IN 1..80 LOOP
    SELECT * INTO p FROM products WHERE stock > 0 ORDER BY random() LIMIT 1;
    q := LEAST(1 + floor(random()*3)::int, p.stock);
    t := now() - (random()*60) * interval '1 day';
    INSERT INTO sales(product_id,customer_id,quantity,total,sold_by,sold_at)
      VALUES (p.id, 1+floor(random()*10)::int, q, p.price*q, 2, t) RETURNING id INTO sid;
    UPDATE products SET stock = stock - q WHERE id = p.id;
    INSERT INTO inventory_logs(product_id,type,quantity,note,created_by,created_at)
      VALUES (p.id,'OUT',q,'Sale #'||sid,2,t);
  END LOOP;
END $$;
-- make a few products low / out of stock for the dashboard
UPDATE products SET stock = 0 WHERE sku='BEV-004';
UPDATE products SET stock = 4 WHERE sku IN ('BEV-003','FOD-004');
UPDATE products SET stock = 2 WHERE sku IN ('MRC-004','OFC-004');

-- ── Finance data (HPP + 12-month history) ─────────────────────────────
-- HPP (cost of goods) ≈ 48–68% of price, varies per product so margins differ.
UPDATE products SET cost = round(price * (0.48 + (id % 6) * 0.04));
-- Historical sales (60–365 days ago), denser toward recent dates = growth trend.
-- Intentionally does not touch stock/inventory_logs (it is past history).
INSERT INTO sales(product_id,customer_id,quantity,total,sold_by,sold_at)
SELECT p.id, 1 + floor(random()*10)::int, q.qty, p.price * q.qty, 2, q.ts
FROM (
  SELECT 1 + floor(random()*(SELECT count(*) FROM products))::int AS pid,
         1 + floor(random()*4)::int AS qty,
         now() - (60 + 305 * power(random(), 1.35)) * interval '1 day' AS ts
  FROM generate_series(1, 1100)
) q JOIN products p ON p.id = q.pid;
