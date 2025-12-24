'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'reports'), 
            (snapshot) => {
                const reportsData: Report[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Report);
                setReports(reportsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching reports: ", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch reports.' });
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, status: 'Pending' | 'Resolved') => {
        const reportRef = doc(db, 'reports', id);
        await updateDoc(reportRef, { status });
        toast({ title: 'Success', description: `Report has been marked as ${status}.` });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-48"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div>;
    }

    return (
        <div>
            <h1 className="font-headline text-3xl font-bold mb-6">Content Reports</h1>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reported Item</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map(report => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.bookTitle || report.userName}</TableCell>
                                <TableCell>{report.reportedBy}</TableCell>
                                <TableCell className="max-w-sm truncate">{report.reason}</TableCell>
                                <TableCell>
                                    <Badge variant={report.status === 'Pending' ? 'destructive' : 'secondary'}>
                                        {report.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            {report.status === 'Pending' &&
                                                <DropdownMenuItem onClick={() => handleStatusChange(report.id, 'Resolved')}>Mark as Resolved</DropdownMenuItem>
                                            }
                                            <DropdownMenuItem>Take Action</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
