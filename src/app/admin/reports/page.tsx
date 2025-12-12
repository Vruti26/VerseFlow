import { reports } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

export default function AdminReportsPage() {
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
                                            <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
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
