import { useState, useRef, useEffect, type FC } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "./badge";

interface ImageUploadProps {
  id: string;
  label: string;
  value?: File;
  existingImageUrl?: string; // URL of existing image (for edit mode)
  onChange: (file: File | undefined) => void;
  disabled?: boolean;
}

const ImageUpload: FC<ImageUploadProps> = ({
  id,
  label,
  existingImageUrl,
  onChange,
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set preview from existing image URL when in edit mode
  useEffect(() => {
    if (existingImageUrl && !preview) {
      setPreview(existingImageUrl);
      setIsNewImage(false);
    }
  }, [existingImageUrl, preview]);

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsNewImage(true);
      };
      reader.readAsDataURL(file);
      onChange(file);
    } else {
      setPreview(existingImageUrl || null);
      setIsNewImage(false);
      onChange(undefined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "mt-2 relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-accent",
          disabled && "opacity-50 cursor-not-allowed",
          preview ? "aspect-video" : "aspect-video"
        )}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          disabled={disabled}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full group">
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                disabled={disabled}
                className="rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>
            <Badge variant="default" className="absolute top-2 right-2">
              {isNewImage ? "Uploaded" : "Current"}
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-3 bg-muted rounded-full mb-3">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
