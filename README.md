####

```sh
-- 允许查看存储桶列表 CREATE POLICY "Allow bucket list" ON storage.buckets FOR SELECT USING (true); -- 允许认证用户上传文件 CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images'); -- 允许公开读取文件 CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'images');
```