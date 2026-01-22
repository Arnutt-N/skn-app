export interface Province {
    PROVINCE_ID: number;
    PROVINCE_THAI: string;
    PROVINCE_ENGLISH: string;
}

export interface District {
    DISTRICT_ID: number;
    PROVINCE_ID: number;
    DISTRICT_THAI: string;
    DISTRICT_ENGLISH: string;
}

export interface SubDistrict {
    SUB_DISTRICT_ID: number;
    DISTRICT_ID: number;
    SUB_DISTRICT_THAI: string;
    SUB_DISTRICT_ENGLISH: string;
    POSTAL_CODE: string;
}
