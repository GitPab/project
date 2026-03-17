/**
 * Shared visa systems constant used across the application
 * This ensures consistency between:
 * - CostInputForm (admin cost configuration)
 * - EditUniversityModal (admin university editing)
 * - UniversityDetail (student visa selection)
 */

export interface VisaSystemOption {
  id: string;
  label: string;
  name: string;
  description: string;
  defaultAvailable?: boolean;
}

export const VISA_SYSTEMS: VisaSystemOption[] = [
  {
    id: 'D4-1',
    label: 'D4-1',
    name: 'Hệ tiếng',
    description: 'Học tiếng Hàn tại trường',
    defaultAvailable: true,
  },
  {
    id: 'D4-2',
    label: 'D4-2',
    name: 'Dự bị',
    description: 'Dự bị trước khi vào đại học',
    defaultAvailable: false,
  },
  {
    id: 'D2-1',
    label: 'D2-1',
    name: 'Dự bị ĐH',
    description: 'Dự bị đại học chính quy',
    defaultAvailable: false,
  },
  {
    id: 'D2-2',
    label: 'D2-2',
    name: 'Đại học',
    description: 'Cử nhân chính quy',
    defaultAvailable: true,
  },
  {
    id: 'D2-3',
    label: 'D2-3',
    name: 'Thạc sĩ',
    description: 'Cao học / thạc sĩ',
    defaultAvailable: true,
  },
  {
    id: 'D2-4',
    label: 'D2-4',
    name: 'Tiến sĩ',
    description: 'Nghiên cứu sinh tiến sĩ',
    defaultAvailable: false,
  },
  {
    id: 'D2-5',
    label: 'D2-5',
    name: 'Nghiên cứu sinh',
    description: 'Research student',
    defaultAvailable: false,
  },
  {
    id: 'D2-6',
    label: 'D2-6',
    name: 'Trao đổi',
    description: 'Exchange program',
    defaultAvailable: false,
  },
  {
    id: 'D2-7',
    label: 'D2-7',
    name: 'Ngắn hạn',
    description: 'Short-term program',
    defaultAvailable: false,
  },
];

/**
 * Get visa system by ID
 */
export const getVisaSystem = (id: string): VisaSystemOption | undefined => {
  return VISA_SYSTEMS.find(v => v.id === id);
};

/**
 * Get visa system label/name by ID
 */
export const getVisaLabel = (id: string): string => {
  return VISA_SYSTEMS.find(v => v.id === id)?.name ?? id;
};

/**
 * Get all visa system IDs
 */
export const getVisaSystemIds = (): string[] => {
  return VISA_SYSTEMS.map(v => v.id);
};
