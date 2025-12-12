import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { books, users, reports } from "@/lib/placeholder-data";
import { Users, BookOpen, ShieldAlert } from "lucide-react";

export default function AdminDashboardPage() {
    const stats = [
        { title: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500' },
        { title: 'Total Books', value: books.length, icon: BookOpen, color: 'text-green-500' },
        { title: 'Pending Reports', value: reports.filter(r => r.status === 'Pending').length, icon: ShieldAlert, color: 'text-yellow-500' },
    ];

    return (
        <div>
            <h1 className="font-headline text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Recent activity feed will be shown here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
