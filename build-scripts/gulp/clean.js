import { deleteSync } from "del";
import gulp from "gulp";
import paths from "../paths.cjs";

gulp.task("clean-insteon", async () =>
    deleteSync([paths.insteon_output_root, paths.build_dir])
);
