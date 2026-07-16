export interface User {
  id: string;
  name: string;
  phone: string;
  assignedEncontristas: string[];
  role?: 'admin' | 'user';
  email?: string;
  type?: 'solteiro' | 'casal';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  assignedTo: string; // user ID or "all"
  createdAt: string;
}

export interface Encontrista {
  id: string;
  name: string;
  phone: string;
  medication: string;
  disability: string;
  observations: string;
  address: string;
  complement: string;
  additionalPhones: string;
  status?: 'pending' | 'completed'; // general fallback status
  status_day1?: 'pending' | 'completed';
  status_day2?: 'pending' | 'completed';
  status_day3?: 'pending' | 'completed';
  pickup_day1?: 'pending' | 'completed';
  dropoff_day1?: 'pending' | 'completed';
  pickup_day2?: 'pending' | 'completed';
  dropoff_day2?: 'pending' | 'completed';
  pickup_day3?: 'pending' | 'completed';
  isMoita?: boolean;
  circleColor?: string; // e.g. "Vermelho", "Azul", "Amarelo", "Verde", "Laranja", "Roxo"
}
