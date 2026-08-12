import type { ImageSourcePropType } from 'react-native';

export type ContactAction = 'profile' | 'invite' | 'block';

export type ContactProfile = {
  id: string;
  name: string;
  status: string;
  phone: string;
  online: boolean;
  verified: boolean;
  favorite: boolean;
  recent: boolean;
  inviteOnly: boolean;
  avatar?: ImageSourcePropType;
};

export type ContactSection = {
  title: string;
  data: ContactProfile[];
};
