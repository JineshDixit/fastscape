import { Users, Shield, Key, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminUserService, roleService, policyService } from "@/api/services/adminService";

interface Stats {
    users: number;
    roles: number;
    policies: number;
    activeSessions: number;
}

const StatsOverview = () => {
    const [stats, setStats] = useState<Stats>({
        users: 0,
        roles: 0,
        policies: 0,
        activeSessions: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, rolesRes, policiesRes] = await Promise.all([
                    adminUserService.getAllAdminUsers({ limit: 1 }),
                    roleService.getAllRoles({ limit: 1 }),
                    policyService.getAllPolicies({ limit: 1 }),
                ]);

                setStats({
                    users: usersRes.total || 0,
                    roles: rolesRes.total || 0,
                    policies: policiesRes.total || 0,
                    activeSessions: 12, // Placeholder
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: "Admin Users",
            value: stats.users,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            description: "Total registered administrators",
        },
        {
            title: "Active Roles",
            value: stats.roles,
            icon: Shield,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            description: "Total defined access roles",
        },
        {
            title: "Policies",
            value: stats.policies,
            icon: Key,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            description: "Security policy definitions",
        },
        {
            title: "System Health",
            value: "Stable",
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10",
            description: "Core services operational",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsOverview;
