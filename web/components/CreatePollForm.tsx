"use client";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreatePollFormProps {
  onSubmit: (
    title: string,
    options: string[],
    allowMultipleVotes: boolean,
    allowChangeVotes: boolean
  ) => void;
}

export default function CreatePollForm({ onSubmit }: CreatePollFormProps) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]); // Start with two empty options
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [allowChangeVotes, setAllowChangeVotes] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    options?: string[];
  }>({});

  // Handle multiple votes toggle
  const handleMultipleVotesChange = (value: boolean) => {
    setAllowMultipleVotes(value);
    if (value) {
      // If multiple votes is enabled, disable change votes
      setAllowChangeVotes(false);
    }
  };

  // Handle change votes toggle
  const handleChangeVotesChange = (value: boolean) => {
    setAllowChangeVotes(value);
    if (value) {
      // If change votes is enabled, disable multiple votes
      setAllowMultipleVotes(false);
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("A poll must have at least 2 options");
      return;
    }

    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);

    // Clear any error for this option
    const newErrors = { ...errors };
    if (newErrors.options) {
      newErrors.options = [...newErrors.options];
      newErrors.options.splice(index, 1);
      setErrors(newErrors);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Clear error for this option
    const newErrors = { ...errors };
    if (newErrors.options && newErrors.options[index]) {
      newErrors.options = [...newErrors.options];
      newErrors.options[index] = "";
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: {
      title?: string;
      options?: string[];
    } = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Title is required";
      toast.error("Poll title is required");
    }

    // Validate options
    const optionErrors: string[] = [];
    let hasEmptyOption = false;

    options.forEach((option, index) => {
      if (!option.trim()) {
        optionErrors[index] = "Option text is required";
        hasEmptyOption = true;
      } else {
        optionErrors[index] = "";
      }
    });

    if (hasEmptyOption) {
      newErrors.options = optionErrors;
      toast.error("All options must have text");
      return false;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(
      options.map((opt) => opt.trim().toLowerCase())
    );
    if (uniqueOptions.size !== options.length) {
      toast.error("Duplicate options are not allowed");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(title, options, allowMultipleVotes, allowChangeVotes);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 w-full">
      <div className="space-y-2">
        <h2 className="text-md md:text-xl font-bold text-slate-800">
          Create a New Poll
        </h2>
        <p className="text-sm text-muted-foreground">
          Create a quick poll for your participants to vote on
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pollTitle" className="text-sm font-medium">
          Poll Title
        </Label>
        <Input
          id="pollTitle"
          className={`border ${
            errors.title ? "border-red-300" : "border-slate-200"
          }`}
          placeholder="What would you like to ask?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Poll Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  className={`border ${
                    errors.options?.[index]
                      ? "border-red-300"
                      : "border-slate-200"
                  }`}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {errors.options?.[index] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.options[index]}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                className="h-10 w-10 p-0 rounded-full hover:bg-slate-100"
              >
                <XIcon className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="w-full mt-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" /> Add Option
          </Button>
        </div>
      </div>

      <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allowMultipleVotes"
              checked={allowMultipleVotes}
              onCheckedChange={(value: boolean) =>
                handleMultipleVotesChange(value as boolean)
              }
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label
              htmlFor="allowMultipleVotes"
              className="font-medium cursor-pointer"
            >
              Allow multiple votes
            </Label>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Participants can select multiple options
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allowChangeVotes"
              checked={allowChangeVotes}
              onCheckedChange={(value: boolean) =>
                handleChangeVotesChange(value as boolean)
              }
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label
              htmlFor="allowChangeVotes"
              className="font-medium cursor-pointer"
            >
              Allow changing votes
            </Label>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Participants can change their selection after voting
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="default" onClick={handleSubmit} className="flex-1">
          Create Poll
        </Button>
      </div>
    </div>
  );
}
