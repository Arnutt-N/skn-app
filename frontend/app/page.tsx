import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, MessageCircle, Settings } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <Card glass className="w-full max-w-2xl text-center">
                <CardContent className="pt-12 pb-12">
                    <div className="mb-6 flex justify-center">
                        <Badge variant="primary" outline className="px-4 py-1.5 text-sm shadow-sm">SKN 4.0 Platform</Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 tracking-tight">
                        ยินดีต้อนรับสู่ <span className="text-primary">SKN 4.0</span>
                    </h1>

                    <p className="text-lg text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
                        การให้บริการ online ด้วยกลไกภาครัฐ
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/admin">
                            <Button size="lg" className="w-full sm:w-auto" leftIcon={<Settings className="w-4 h-4" />}>
                                เข้าสู่ระบบ Admin
                            </Button>
                        </Link>

                        <Link href="/liff/service-request">
                            <Button variant="success" size="lg" className="w-full sm:w-auto" leftIcon={<MessageCircle className="w-4 h-4" />}>
                                LIFF Demo
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <footer className="mt-12 text-sm text-gray-400">
                © 2026 Community Justice Services. All rights reserved.
            </footer>
        </main>
    )
}

