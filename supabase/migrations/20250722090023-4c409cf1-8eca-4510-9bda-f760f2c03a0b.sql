-- 手动确认用户邮件
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'yanz57213@gmail.com' AND email_confirmed_at IS NULL;