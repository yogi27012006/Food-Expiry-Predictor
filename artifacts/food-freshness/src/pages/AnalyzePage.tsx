import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Sparkles, X, ArrowRight, Camera, Loader2 } from "lucide-react";
import { useAnalyzeFood, getListFoodItemsQueryKey } from "@workspace/api-client-react";
import type { FoodItem } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { FreshnessRing } from "@/components/FreshnessRing";
import { cn, getFreshnessColor } from "@/lib/utils";
import { format } from "date-fns";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [result, setResult] = useState<FoodItem | null>(null);
  
  const queryClient = useQueryClient();
  const { mutate: analyze, isPending } = useAnalyzeFood({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        queryClient.invalidateQueries({ queryKey: getListFoodItemsQueryKey() });
      },
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null); // Clear previous result
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: isPending
  });

  const handleAnalyze = () => {
    if (!file) return;
    analyze({
      data: {
        image: file,
        ...(foodName ? { foodName } : {})
      }
    });
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setFoodName("");
    setResult(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full flex flex-col gap-8 items-center"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          Check your food's <span className="text-primary relative inline-block">
            freshness
            <Sparkles className="absolute -top-4 -right-6 w-6 h-6 text-accent animate-pulse" />
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Upload a photo of your produce. Our AI analyzes color, texture, and surface conditions to predict exactly when it will expire.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div 
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            className="w-full"
          >
            <div className="glass-card p-2 rounded-3xl overflow-hidden relative">
              
              {!file ? (
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-6 cursor-pointer min-h-[320px]",
                    isDragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-border hover:border-primary/50 hover:bg-secondary/30",
                    isPending && "opacity-50 pointer-events-none"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
                    isDragActive ? "bg-primary text-white" : "bg-secondary text-primary"
                  )}>
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-medium text-foreground">
                      {isDragActive ? "Drop to analyze!" : "Drag & drop your food photo"}
                    </p>
                    <p className="text-muted-foreground mt-2">or click to browse from your device</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden group">
                  <div className="aspect-[4/3] w-full bg-black/5 relative">
                    <img 
                      src={preview!} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  <button 
                    onClick={handleReset}
                    disabled={isPending}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-10 disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-4">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="What is this? (Optional)"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/90 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-white focus:text-foreground placeholder:text-white/70 focus:placeholder:text-muted-foreground transition-all outline-none focus:ring-2 ring-primary disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Analyzing Freshness...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Analyze Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result-zone"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full"
          >
            <div className="glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row">
              {/* Image side */}
              <div className="w-full md:w-2/5 aspect-square md:aspect-auto relative bg-secondary">
                {preview ? (
                  <img src={preview} alt="Analyzed food" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-16 h-16 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 md:from-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 md:hidden">
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{result.foodName}</h2>
                </div>
              </div>

              {/* Details side */}
              <div className="p-6 sm:p-8 md:w-3/5 flex flex-col">
                <div className="hidden md:flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-display font-bold text-foreground capitalize">{result.foodName}</h2>
                  <button 
                    onClick={handleReset}
                    className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Scan Another
                  </button>
                </div>

                <div className="flex items-center gap-6 mb-8">
                  <FreshnessRing score={result.freshnessScore} size={100} strokeWidth={10} />
                  <div>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</p>
                    <div className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border",
                      getFreshnessColor(result.freshnessScore),
                      "bg-current/[0.08] border-current/[0.2]"
                    )}>
                      {result.freshnessLabel}
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-2xl p-5 mb-6 border border-border/50">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Predicted Expiry</p>
                  <div className="flex items-end gap-3">
                    <span className="text-2xl font-bold text-foreground">
                      {format(new Date(result.predictedExpiryDate), 'MMM do, yyyy')}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold pb-1",
                      result.daysUntilExpiry < 0 ? "text-destructive" :
                      result.daysUntilExpiry <= 2 ? "text-accent" : "text-muted-foreground"
                    )}>
                      {result.daysUntilExpiry < 0 
                        ? `Expired ${Math.abs(result.daysUntilExpiry)} days ago` 
                        : result.daysUntilExpiry === 0 
                          ? "Expires today" 
                          : `In ${result.daysUntilExpiry} days`}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Analysis
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {result.aiAnalysis}
                  </p>
                </div>
                
                <div className="md:hidden mt-8">
                  <button 
                    onClick={handleReset}
                    className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 rounded-xl transition-colors"
                  >
                    Scan Another Item
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
