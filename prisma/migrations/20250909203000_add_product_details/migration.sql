-- Add product details columns
ALTER TABLE "public"."ReviewTarget" 
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled Product',
ADD COLUMN "image" TEXT;

-- Remove the default constraint after adding the column
ALTER TABLE "public"."ReviewTarget" 
ALTER COLUMN "title" DROP DEFAULT;