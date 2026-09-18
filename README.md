# Ksho - Kalkulatori i Shpenzimeve Online

You are a senior software engineer and experienced full-stack developer.

Build a modern personal web app called KSHO – Kalkulatori i Shpenzimeve Online.

The app is for tracking and analyzing personal expenses from online orders such as AliExpress, GjirafaMall, Facebook Marketplace, and other platforms.

Core functionality

Create a clean financial/order tracking system with:

Dashboard

Total spending

Number of orders

Spending this month

Average order cost

Total shipping costs

Total personal discounts

Recent orders

Spending breakdown by platform

Spending breakdown by payment method

Add Order
Fields:

Platform: AliExpress, GjirafaMall, Facebook, Other

Product name

Category

Quantity

Product price

Shipping cost

Personal discount

Automatic total calculation

Order date

Payment method:



Card

Apple Pay

Cash

Status:



Ordered

In Transit

Received

Cancelled

Returned

Optional Order ID

Optional order URL

Optional tracking number

Optional notes

Calculation:

(Product Price × Quantity) + Shipping Cost − Personal Discount = Final Total

The personal discount is only for the user’s own expense calculation and must not overwrite the original product price.

Orders

Create a dedicated Orders page with:

Search

Platform filter

Category filter

Payment method filter

Status filter

Date range filter

Sorting

Edit order

Delete order

Order details view

Reports

Create a Reports section with:

Monthly spending

Yearly spending

Spending by platform

Spending by category

Spending by payment method

Shipping costs

Discounts

Average order value

Custom date range

Add charts where useful, but keep them clean and professional.

Excel Export

Add a proper Export to Excel (.xlsx) feature.

Export:

All orders

Product details

Platform

Quantity

Original price

Shipping

Discount

Final total

Payment method

Status

Date

Order ID

Tracking number

Notes

Also include a summary sheet with totals and statistics.

Date filters

Provide:

Today

This Week

This Month

Last 3 Months

This Year

Custom Range

Design

Use a modern fintech-inspired interface.

Color direction:

AliExpress-inspired red as primary

Orange as secondary/accent

Light blue for informational elements

Dark navy for text

Clean white/light backgrounds

Green only for positive financial/status indicators

Do NOT copy AliExpress UI. Only take inspiration from its red/orange/blue color combination.

The interface should feel like a professional personal finance dashboard, not an e-commerce website.

Make it responsive and optimized for both desktop and mobile.

Use clear cards, tables, charts, badges, filters and modal/forms where appropriate.

Important

Keep the architecture simple and maintainable.

Do not add unnecessary social, marketplace, crypto, gambling, AI prediction, or e-commerce functionality.

This is a personal online-order expense tracker and calculator.

Implement the complete UI and UX professionally, with consistent empty states, loading states, validation, confirmation dialogs and error handling.

Before finishing, verify that calculations, filters, CRUD operations and Excel export work correctly and that the application works without horizontal overflow on mobile.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ksho-online.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c127c14-cfec-4cf7-a04f-124e5c042bba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
