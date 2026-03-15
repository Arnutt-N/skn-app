import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  MessageCircle, Settings, ArrowRight, Bot, BarChart3, Users,
  Shield, Zap, Globe,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'Chatbot อัจฉริยะ',
    description: 'ระบบตอบกลับอัตโนมัติด้วย Intent matching หลายระดับ รองรับ Flex Message และ LINE Rich Menu',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat ทันที',
    description: 'เจ้าหน้าที่รับสายจาก LINE ผ่าน real-time WebSocket พร้อมระบบ Queue และ CSAT',
    color: 'text-info-dark',
    bg: 'bg-info/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics ครบครัน',
    description: 'ติดตาม KPI แบบ real-time, รายงานประสิทธิภาพ, และ Audit Log ทุกการกระทำ',
    color: 'text-success-dark',
    bg: 'bg-success/10',
  },
  {
    icon: Users,
    title: 'จัดการ Service Request',
    description: 'รับเรื่อง ติดตาม และปิดงานบริการด้วย Kanban board พร้อมระบบมอบหมาย',
    color: 'text-warning-dark',
    bg: 'bg-warning/10',
  },
  {
    icon: Shield,
    title: 'ปลอดภัยและเชื่อถือได้',
    description: 'JWT authentication, role-based access, Fernet credential encryption และ audit trail',
    color: 'text-danger-dark',
    bg: 'bg-danger/10',
  },
  {
    icon: Globe,
    title: 'LINE OA Integration',
    description: 'เชื่อมต่อ LINE Messaging API, LIFF, Rich Menu และ Webhook อย่างสมบูรณ์',
    color: 'text-accent-dark',
    bg: 'bg-accent/10',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-bg thai-text overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-info/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 py-20 text-center">
        <Badge variant="primary" outline className="mb-8 px-4 py-1.5 text-sm">
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          JSK 4.0 Platform
        </Badge>

        <div className="w-16 h-16 rounded-3xl gradient-logo flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/20 mb-6">
          JS
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-tight">
          <span className="text-text-primary">ระบบจัดการ</span>{' '}
          <span className="text-gradient">LINE OA</span>
        </h1>

        <p className="text-lg text-text-secondary mb-3 max-w-lg mx-auto leading-relaxed">
          สำหรับงานยุติธรรมชุมชน
        </p>
        <p className="text-base text-text-tertiary mb-12 max-w-md mx-auto">
          บริหาร Service Request, Live Chat, Chatbot และ Analytics ในที่เดียว
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/admin">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<Settings className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              เข้าสู่ระบบ Admin
            </Button>
          </Link>

          <Link href="/liff/service-request">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<MessageCircle className="w-4 h-4" />}
            >
              แบบฟอร์ม LIFF
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            ฟีเจอร์หลัก
          </h2>
          <p className="text-text-secondary">ทุกอย่างที่คุณต้องการสำหรับจัดการ LINE OA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                variant="default"
                className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2 thai-no-break">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-text-tertiary border-t border-border-subtle">
        © 2026 Community Justice Services · JSK 4.0
      </footer>
    </main>
  );
}
