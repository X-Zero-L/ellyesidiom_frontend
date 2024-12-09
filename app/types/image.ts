type ImageDetails = {
  tags: string[];
  image_hash: string;
  image_url: string;
  comment: string[];
  catalogue: string[];
  catalogue_raw: string[];
  under_review: boolean;
  timestamp: string;
  uploader: {
    nickname: string;
    id: string;
    platform: string;
  };
  likes: string[];
  hates: string[];
};
type AdminImageDetails = {
  tags: string[];
  image_hash: string;
  image_ext: string;
  ocr_text: string[];
  ocr_method: string;
  uploader: {
    nickname: string;
    id: string;
    platform: string;
  };
  under_review: boolean;
  comment: string[];
  catalogue: string[];
  timestamp: string;
};

export type { ImageDetails, AdminImageDetails };