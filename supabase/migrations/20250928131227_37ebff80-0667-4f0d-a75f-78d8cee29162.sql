-- Add prayer_id foreign key to world_kids_news table
ALTER TABLE public.world_kids_news 
ADD COLUMN prayer_id uuid REFERENCES public.prayers(id) ON DELETE CASCADE;

-- Create world_kids_news_translations table (completely optional)
CREATE TABLE public.world_kids_news_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_kids_news_id uuid NOT NULL REFERENCES public.world_kids_news(id) ON DELETE CASCADE,
  language text NOT NULL,
  title text,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(world_kids_news_id, language)
);

-- Enable RLS on the new table
ALTER TABLE public.world_kids_news_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for world_kids_news_translations
CREATE POLICY "Everyone can view world kids news translations"
ON public.world_kids_news_translations
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create world kids news translations"
ON public.world_kids_news_translations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update world kids news translations"
ON public.world_kids_news_translations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete world kids news translations"
ON public.world_kids_news_translations
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_world_kids_news_translations_updated_at
BEFORE UPDATE ON public.world_kids_news_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();