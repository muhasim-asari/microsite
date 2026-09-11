export interface Profile {
  username: string;
  display_name: string;
  bio: string;
  avatar: string;
}

export interface LinkItem {
  id: string;
  platform: string;
  title: string;
  url: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}
