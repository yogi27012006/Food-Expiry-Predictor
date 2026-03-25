import { useListFoodItems, useDeleteFoodItem, getListFoodItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertCircle, CalendarClock, Leaf } from "lucide-react";
import { format } from "date-fns";
import { cn, getFreshnessColor } from "@/lib/utils";
import { Link } from "wouter";

export default function MyFoodPage() {
  const { data: items, isLoading } = useListFoodItems();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteFoodItem();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFoodItemsQueryKey() });
        }
      });
    }
  };

  // Sort by expiry date, ascending (closest to expire first)
  const sortedItems = items ? [...items].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry) : [];

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading your fridge...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">My Food</h1>
          <p className="text-muted-foreground mt-2">Tracked items and their predicted expiry dates.</p>
        </div>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Leaf className="w-4 h-4" />
          Analyze New
        </Link>
      </div>

      {!sortedItems.length ? (
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center border-dashed">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Leaf className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No food tracked yet</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Upload photos of your groceries to start tracking their freshness and get notified before they expire.
          </p>
          <Link 
            href="/"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Start Analyzing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sortedItems.map((item, i) => {
              const isExpiringSoon = item.daysUntilExpiry <= 2 && item.daysUntilExpiry >= 0;
              const isExpired = item.daysUntilExpiry < 0;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "glass-card rounded-2xl overflow-hidden flex flex-col relative group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                    isExpired ? "border-destructive/30 bg-destructive/5" :
                    isExpiringSoon ? "border-accent/30 bg-accent/5" : ""
                  )}
                >
                  {(isExpiringSoon || isExpired) && (
                    <div className={cn(
                      "absolute top-0 inset-x-0 h-1 z-10",
                      isExpired ? "bg-destructive" : "bg-accent"
                    )} />
                  )}

                  <div className="h-40 bg-secondary/50 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.foodName} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                      <h3 className="text-xl font-bold text-white drop-shadow-md capitalize truncate pr-2">
                        {item.foodName}
                      </h3>
                      <div className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide backdrop-blur-md border",
                        getFreshnessColor(item.freshnessScore),
                        "bg-white/90 dark:bg-black/90 border-white/20"
                      )}>
                        {item.freshnessScore}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarClock className={cn(
                        "w-5 h-5",
                        isExpired ? "text-destructive" : 
                        isExpiringSoon ? "text-accent" : "text-muted-foreground"
                      )} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {format(new Date(item.predictedExpiryDate), 'MMM do, yyyy')}
                        </span>
                        <span className={cn(
                          "text-xs font-medium",
                          isExpired ? "text-destructive" : 
                          isExpiringSoon ? "text-accent" : "text-muted-foreground"
                        )}>
                          {isExpired ? `Expired ${Math.abs(item.daysUntilExpiry)}d ago` : 
                           item.daysUntilExpiry === 0 ? "Expires today!" :
                           `In ${item.daysUntilExpiry} days`}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-white line-clamp-3 mb-4 flex-1">
                      {item.aiAnalysis}
                    </p>

                    <div className="pt-4 border-t border-border/50 flex justify-between items-center mt-auto">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded bg-secondary",
                        getFreshnessColor(item.freshnessScore)
                      )}>
                        {item.freshnessLabel}
                      </span>
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        aria-label="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
