-- Create prayers table for storing weekly prayer metadata
CREATE TABLE public.prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_date DATE NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayer translations table for bilingual content
CREATE TABLE public.prayer_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_id UUID NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'zh-TW')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prayer_id, language)
);

-- Enable Row Level Security
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_translations ENABLE ROW LEVEL SECURITY;

-- Create policies for prayers (public read, auth write)
CREATE POLICY "Everyone can view prayers" 
ON public.prayers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create prayers" 
ON public.prayers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prayers" 
ON public.prayers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prayers" 
ON public.prayers 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create policies for prayer translations (public read, auth write)
CREATE POLICY "Everyone can view prayer translations" 
ON public.prayer_translations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create prayer translations" 
ON public.prayer_translations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prayer translations" 
ON public.prayer_translations 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete prayer translations" 
ON public.prayer_translations 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates on prayers
CREATE TRIGGER update_prayers_updated_at
BEFORE UPDATE ON public.prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on prayer translations
CREATE TRIGGER update_prayer_translations_updated_at
BEFORE UPDATE ON public.prayer_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_prayers_week_date ON public.prayers(week_date DESC);
CREATE INDEX idx_prayer_translations_prayer_id ON public.prayer_translations(prayer_id);
CREATE INDEX idx_prayer_translations_language ON public.prayer_translations(language);
CREATE INDEX idx_prayer_translations_title_search ON public.prayer_translations USING GIN(to_tsvector('english', title));
CREATE INDEX idx_prayer_translations_content_search ON public.prayer_translations USING GIN(to_tsvector('english', content));