import { SavedLead } from "./savedLeadsApi";

/**
 * Export an array of saved leads as a CSV file download.
 * Columns: Name, Address, Phone, City, Category, Status, Created At
 */
export function exportLeadsToCsv(leads: SavedLead[]): void {
  const headers = ["Name", "Address", "Phone", "City", "Category", "Status", "Created At"];

  const rows = leads.map((lead) => [
    lead.name,
    lead.address,
    lead.phone,
    `${lead.city}${lead.state ? ", " + lead.state : ""}`,
    lead.category,
    lead.status,
    new Date(lead.created_at).toLocaleDateString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `saved-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
