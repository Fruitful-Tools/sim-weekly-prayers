-- Create storage bucket for prayer images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prayer-images', 'prayer-images', true);

-- Create storage policies for prayer images
CREATE POLICY "Anyone can view prayer images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'prayer-images');

CREATE POLICY "Authenticated users can upload prayer images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'prayer-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prayer images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'prayer-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prayer images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'prayer-images' AND auth.uid() IS NOT NULL);