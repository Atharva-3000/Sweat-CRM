import { NextResponse } from "next/server";

export async function GET() {
  const csv = "Name,Phone,Email,Plan,Start Date,End Date,Opening Balance,Notes\nRahul Sharma,9876543210,rahul@example.com,Monthly,2023-10-01,,500,Wants evening batch\nSneha Patel,91 999 888 7777,,Yearly,4-Oct-2023,04/10/24,0,Family member of Ajay\n";
  
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=sweat_crm_import_template.csv",
    },
  });
}
