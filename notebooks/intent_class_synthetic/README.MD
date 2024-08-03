# Intent Classification Model with Synthetic Data

This directory contains all of the code for Okareo's blog post *Using Synthetic Data to Improve Test Coverage and Performance*.

## Training the Base model

The first thing to do is train the Base model. This trains a DistilBERT model on the human-generated training data in the data/ directory.

## Generate synthetic training data

Next you can generate synthetic training data. This expands the training dataset using Okareo's generators.

## Training the Synthetic model

Using largely the same method as training the Base model, you can use the newly generated synthetic training data to train the Synthetic model.

## Generate synthetic test data and evaluate

Finally, generate synthetic test data using the same generators as before.

Once all the test data is ready, compare the two models.