'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/app/admin/components/PageHeader';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronLeft,
    Phone,
    FileText,
    MapPin,
} from 'lucide-react';

interface FormData {
    source: string;
    prefix: string;
    firstname: string;
    lastname: string;
    phone_number: string;
    email: string;
    topic_category: string;
    topic_subcategory: string;
    description: string;
    priority: string;
    province: string;
    district: string;
    sub_district: string;
    agency: string;
}

const INITIAL_FORM_DATA: FormData = {
    source: 'PHONE',
    prefix: 'นาย',
    firstname: '',
    lastname: '',
    phone_number: '',
    email: '',
    topic_category: 'ร้องเรียน',
    topic_subcategory: '',
    description: '',
    priority: 'MEDIUM',
    province: '',
    district: '',
    sub_district: '',
    agency: '',
};

const SOURCE_OPTIONS = [
    { value: 'PHONE', label: 'โทรศัพท์' },
    { value: 'PAPER', label: 'กระดาษ' },
    { value: 'WALK_IN', label: 'Walk-in' },
    { value: 'ADMIN', label: 'อื่นๆ' },
];

const PREFIX_OPTIONS = [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'อื่นๆ', label: 'อื่นๆ' },
];

const CATEGORY_OPTIONS = [
    { value: 'ร้องเรียน', label: 'ร้องเรียน' },
    { value: 'ร้องทุกข์', label: 'ร้องทุกข์' },
    { value: 'แจ้งเบาะแส', label: 'แจ้งเบาะแส' },
    { value: 'ขอความช่วยเหลือ', label: 'ขอความช่วยเหลือ' },
    { value: 'อื่นๆ', label: 'อื่นๆ' },
];

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'LOW — ต่ำ' },
    { value: 'MEDIUM', label: 'MEDIUM — ปานกลาง' },
    { value: 'HIGH', label: 'HIGH — สูง' },
    { value: 'URGENT', label: 'URGENT — เร่งด่วน' },
];

const STEPS = [
    { label: 'ข้อมูลผู้ร้อง', icon: Phone },
    { label: 'รายละเอียดคำร้อง', icon: FileText },
    { label: 'ที่อยู่ / หน่วยงาน', icon: MapPin },
];

export default function CreateRequestPage() {
    const router = useRouter();
    const { token } = useAuth();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const canProceedStep0 = formData.firstname.trim() !== '' && formData.lastname.trim() !== '';
    const canProceedStep1 = formData.description.trim() !== '';

    const handleNext = () => {
        if (step < 2) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE}/admin/requests`, {
                method: 'POST',
                headers,
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const message = errorData?.detail || `เกิดข้อผิดพลาด (${res.status})`;
                throw new Error(message);
            }

            router.push('/admin/requests');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'ไม่สามารถสร้างคำร้องได้ กรุณาลองใหม่';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 thai-text">
            {/* Page Header */}
            <PageHeader title="สร้างคำร้องใหม่" subtitle="บันทึกคำร้องจากช่องทางอื่น เช่น โทรศัพท์ กระดาษ หรือ Walk-in">
                <Link href="/admin/requests">
                    <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}>
                        กลับ
                    </Button>
                </Link>
            </PageHeader>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = i === step;
                    const isCompleted = i < step;

                    return (
                        <div key={i} className="flex items-center gap-2">
                            {i > 0 && (
                                <div className={`w-8 h-0.5 rounded-full transition-colors ${isCompleted ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    // อนุญาตให้กดกลับไปขั้นตอนก่อนหน้าได้
                                    if (i < step) setStep(i);
                                }}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                                        : isCompleted
                                            ? 'bg-success/10 text-success cursor-pointer hover:bg-success/20'
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-default'
                                    }
                                `}
                                disabled={i > step}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">{s.label}</span>
                                <span className="sm:hidden">{i + 1}</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Form Card */}
            <Card glass className="border-none shadow-sm max-w-2xl mx-auto">
                <CardContent className="p-6">
                    {/* Step 0: ข้อมูลผู้ร้อง */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-text-primary">ข้อมูลผู้ร้อง & ช่องทาง</h2>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">ช่องทางรับเรื่อง</label>
                                <Select
                                    value={formData.source}
                                    onChange={(e) => updateField('source', e.target.value)}
                                    options={SOURCE_OPTIONS}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">คำนำหน้า</label>
                                    <Select
                                        value={formData.prefix}
                                        onChange={(e) => updateField('prefix', e.target.value)}
                                        options={PREFIX_OPTIONS}
                                    />
                                </div>
                                <div>{/* spacer */}</div>

                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        ชื่อ <span className="text-danger">*</span>
                                    </label>
                                    <Input
                                        value={formData.firstname}
                                        onChange={(e) => updateField('firstname', e.target.value)}
                                        placeholder="ชื่อจริง"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        นามสกุล <span className="text-danger">*</span>
                                    </label>
                                    <Input
                                        value={formData.lastname}
                                        onChange={(e) => updateField('lastname', e.target.value)}
                                        placeholder="นามสกุล"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">เบอร์โทรศัพท์</label>
                                    <Input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => updateField('phone_number', e.target.value)}
                                        placeholder="0xx-xxx-xxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">อีเมล</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: รายละเอียดคำร้อง */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-text-primary">รายละเอียดคำร้อง</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">หมวดหมู่</label>
                                    <Select
                                        value={formData.topic_category}
                                        onChange={(e) => updateField('topic_category', e.target.value)}
                                        options={CATEGORY_OPTIONS}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">หมวดหมู่ย่อย</label>
                                    <Input
                                        value={formData.topic_subcategory}
                                        onChange={(e) => updateField('topic_subcategory', e.target.value)}
                                        placeholder="ระบุหมวดหมู่ย่อย (ถ้ามี)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                    รายละเอียด <span className="text-danger">*</span>
                                </label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="อธิบายรายละเอียดของคำร้อง..."
                                    size="lg"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">ความเร่งด่วน</label>
                                <Select
                                    value={formData.priority}
                                    onChange={(e) => updateField('priority', e.target.value)}
                                    options={PRIORITY_OPTIONS}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: ที่อยู่ / หน่วยงาน */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-text-primary">ที่อยู่ / หน่วยงาน</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">จังหวัด</label>
                                    <Input
                                        value={formData.province}
                                        onChange={(e) => updateField('province', e.target.value)}
                                        placeholder="จังหวัด"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">อำเภอ / เขต</label>
                                    <Input
                                        value={formData.district}
                                        onChange={(e) => updateField('district', e.target.value)}
                                        placeholder="อำเภอ / เขต"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">ตำบล / แขวง</label>
                                    <Input
                                        value={formData.sub_district}
                                        onChange={(e) => updateField('sub_district', e.target.value)}
                                        placeholder="ตำบล / แขวง"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">หน่วยงานที่รับผิดชอบ</label>
                                    <Input
                                        value={formData.agency}
                                        onChange={(e) => updateField('agency', e.target.value)}
                                        placeholder="หน่วยงาน"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-danger/10 text-danger-text rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-border-default">
                        {step > 0 ? (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                            >
                                ย้อนกลับ
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < 2 ? (
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                disabled={
                                    (step === 0 && !canProceedStep0) ||
                                    (step === 1 && !canProceedStep1)
                                }
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                                ถัดไป
                            </Button>
                        ) : (
                            <Button
                                variant="success"
                                onClick={handleSubmit}
                                isLoading={submitting}
                                loadingText="กำลังบันทึก..."
                                leftIcon={<Check className="w-4 h-4" />}
                            >
                                บันทึกคำร้อง
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
