-- Create table for 萬國小新聞 禱告大冒險
CREATE TABLE public.world_kids_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_date DATE NOT NULL UNIQUE,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT world_kids_news_images_check CHECK (array_length(image_urls, 1) >= 1)
);

-- Enable Row Level Security
ALTER TABLE public.world_kids_news ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view world kids news" 
ON public.world_kids_news 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create world kids news" 
ON public.world_kids_news 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update world kids news" 
ON public.world_kids_news 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete world kids news" 
ON public.world_kids_news 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_world_kids_news_updated_at
BEFORE UPDATE ON public.world_kids_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();