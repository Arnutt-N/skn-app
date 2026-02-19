import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MessageCircle, Settings, ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-background to-primary/5 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

            <Card glass className="w-full max-w-2xl text-center relative">
                <CardContent className="pt-14 pb-14">
                    <div className="mb-8 flex justify-center">
                        <Badge variant="primary" outline className="px-4 py-1.5 text-sm shadow-sm">
                            JSK 4.0 Platform
                        </Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight flex items-center justify-center gap-3">
                        <span className="text-slate-800">ยินดีต้อนรับสู่</span>
                        <span className="text-gradient-primary">JSK 4.0</span>
                    </h1>

                    <p className="text-base text-slate-500 mb-12 max-w-md mx-auto leading-relaxed">
                        การให้บริการ online ด้วยกลไกภาครัฐ
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/admin">
                            <Button size="lg" className="w-full sm:w-auto" leftIcon={<Settings className="w-4 h-4" />} rightIcon={<ArrowRight className="w-4 h-4" />}>
                                เข้าสู่ระบบ Admin
                            </Button>
                        </Link>

                        <Link href="/liff/service-request">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto" leftIcon={<MessageCircle className="w-4 h-4" />}>
                                LIFF Demo
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <footer className="mt-14 text-xs text-slate-400 tracking-wide">
                © 2026 Community Justice Services. All rights reserved.
            </footer>
        </main>
    )
}
